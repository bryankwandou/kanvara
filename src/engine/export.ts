import { compositeToNew } from './compositor';
import type { CanvasDoc } from './types';

export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export const FORMATS: { id: ExportFormat; label: string; ext: string; alpha: boolean }[] = [
  { id: 'image/png', label: 'PNG', ext: 'png', alpha: true },
  { id: 'image/jpeg', label: 'JPEG', ext: 'jpg', alpha: false },
  { id: 'image/webp', label: 'WebP', ext: 'webp', alpha: true },
];

/** Common output sizes, kept as long-edge targets so they work either orientation. */
export const SIZE_PRESETS: { label: string; w: number; h: number }[] = [
  { label: 'Instagram post', w: 1080, h: 1080 },
  { label: 'Instagram story', w: 1080, h: 1920 },
  { label: 'YouTube thumbnail', w: 1280, h: 720 },
  { label: 'Twitter / X post', w: 1600, h: 900 },
  { label: 'Facebook cover', w: 1640, h: 624 },
  { label: 'LinkedIn banner', w: 1584, h: 396 },
  { label: 'A4 at 300dpi', w: 2480, h: 3508 },
  { label: '4K landscape', w: 3840, h: 2160 },
];

/**
 * Downscaling in a single drawImage step aliases badly past about 2x, because
 * the browser only samples a small neighbourhood. Halving repeatedly until the
 * last step is under 2x costs a few extra draws and removes the shimmer on
 * fine detail like hair and text.
 */
function resample(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  let current = src;
  let cw = src.width;
  let ch = src.height;

  while (cw > w * 2 && ch > h * 2) {
    cw = Math.max(w, Math.floor(cw / 2));
    ch = Math.max(h, Math.floor(ch / 2));
    const step = document.createElement('canvas');
    step.width = cw;
    step.height = ch;
    const ctx = step.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current, 0, 0, cw, ch);
    current = step;
  }

  if (cw === w && ch === h) return current;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, 0, 0, w, h);
  return out;
}

export type ExportOptions = {
  format: ExportFormat;
  quality: number; // 0..1, ignored for PNG
  width?: number;
  height?: number;
  /** JPEG has no alpha, so transparent areas need something behind them. */
  matte?: string;
};

export async function renderExport(doc: CanvasDoc, opts: ExportOptions): Promise<Blob> {
  let canvas = compositeToNew(doc);

  const w = opts.width ?? doc.width;
  const h = opts.height ?? doc.height;
  if (w !== canvas.width || h !== canvas.height) canvas = resample(canvas, w, h);

  if (opts.format === 'image/jpeg') {
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const ctx = flat.getContext('2d')!;
    ctx.fillStyle = opts.matte ?? '#ffffff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    canvas = flat;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('The browser refused to encode this image.'))),
      opts.format,
      opts.format === 'image/png' ? undefined : opts.quality,
    );
  });
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function estimateBytes(w: number, h: number, format: ExportFormat, quality: number): number {
  const pixels = w * h;
  if (format === 'image/png') return Math.round(pixels * 2.4);
  const base = format === 'image/webp' ? 0.34 : 0.52;
  return Math.round(pixels * base * (0.25 + quality * 0.75));
}

export function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
