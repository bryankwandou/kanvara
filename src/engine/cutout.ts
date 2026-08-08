/**
 * Background removal.
 *
 * The default path runs the segmentation model in the browser via WASM. It is
 * slower on the first run because the model has to download, but after that it
 * is cached by the service worker layer of the browser and works with the
 * network off — which is the whole point of the product. Nothing about the
 * user's photo leaves the machine.
 *
 * A remote endpoint can be substituted by setting NEXT_PUBLIC_CUTOUT_ENDPOINT.
 * It is expected to accept a multipart POST with an `image` field and reply
 * with a PNG that has an alpha channel.
 */

const REMOTE = process.env.NEXT_PUBLIC_CUTOUT_ENDPOINT;

async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext('2d')!.drawImage(bmp, 0, 0);
  bmp.close();
  return c;
}

function sourceToBlob(src: CanvasImageSource, w: number, h: number): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(src, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read the layer.'))), 'image/png'),
  );
}

async function removeRemote(blob: Blob): Promise<HTMLCanvasElement> {
  const form = new FormData();
  form.append('image', blob, 'layer.png');
  const res = await fetch(REMOTE!, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Cutout service replied ${res.status}.`);
  return blobToCanvas(await res.blob());
}

async function removeLocal(
  blob: Blob,
  onProgress?: (fraction: number) => void,
): Promise<HTMLCanvasElement> {
  const { removeBackground } = await import('@imgly/background-removal');
  const out = await removeBackground(blob, {
    output: { format: 'image/png', quality: 1 },
    progress: (_key, current, total) => {
      if (total > 0) onProgress?.(current / total);
    },
  });
  return blobToCanvas(out);
}

export async function removeBackgroundFrom(
  src: CanvasImageSource,
  width: number,
  height: number,
  onProgress?: (fraction: number) => void,
): Promise<HTMLCanvasElement> {
  const blob = await sourceToBlob(src, width, height);
  if (REMOTE) {
    try {
      return await removeRemote(blob);
    } catch {
      // A dead endpoint should degrade to the local model rather than
      // leaving the user with nothing.
      return removeLocal(blob, onProgress);
    }
  }
  return removeLocal(blob, onProgress);
}

/**
 * Chroma-key style eraser: drops every pixel within `tolerance` of the sampled
 * colour. Instant, no model, and it is the right tool when the subject sits on
 * a flat studio background where a neural matte is overkill.
 */
export function removeColour(
  src: CanvasImageSource,
  width: number,
  height: number,
  target: [number, number, number],
  tolerance: number, // 0..100
  feather: number, // 0..100
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, width, height);

  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;

  const hard = (tolerance / 100) * 441.67; // max euclidean distance in RGB
  const soft = hard + (feather / 100) * 120;

  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.hypot(d[i] - target[0], d[i + 1] - target[1], d[i + 2] - target[2]);
    if (dist <= hard) {
      d[i + 3] = 0;
    } else if (dist < soft) {
      d[i + 3] = Math.round(d[i + 3] * ((dist - hard) / (soft - hard)));
    }
  }

  ctx.putImageData(img, 0, 0);
  return c;
}
