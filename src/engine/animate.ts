import type { CanvasDoc, Layer } from './types';

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function noise(t: number, seed: number) {
  return Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453 % 1;
}

/**
 * Returns the document as it should look at time `t`, without touching the
 * original. Animation is a pure function of time here, which is what lets the
 * same code drive the live preview, the scrubber, and the video encoder — all
 * three stay in sync because none of them owns any state.
 */
export function docAtTime(doc: CanvasDoc, t: number): CanvasDoc {
  return {
    ...doc,
    layers: doc.layers.map((layer, index) => animateLayer(layer, t, index)),
  };
}

function animateLayer(layer: Layer, t: number, index: number): Layer {
  const a = layer.anim;
  if (!a || a.kind === 'none') return layer;

  const local = t - a.delay;
  if (local < 0) return { ...layer, opacity: 0 };

  const raw = a.duration > 0 ? local / a.duration : 1;
  const p = a.loop ? raw % 1 : Math.min(1, raw);
  const k = a.intensity / 100;

  const tr = { ...layer.transform };
  let opacity = layer.opacity;

  switch (a.kind) {
    case 'fade':
      opacity = layer.opacity * easeOut(Math.min(1, raw));
      break;

    case 'zoom': {
      const s = 1 + (1 - easeOut(Math.min(1, raw))) * 0.6 * k;
      tr.scaleX *= s;
      tr.scaleY *= s;
      break;
    }

    case 'pan':
      tr.x += (1 - easeOut(Math.min(1, raw))) * 400 * k;
      break;

    case 'kenburns': {
      const e = easeInOut(p);
      const s = 1 + (0.12 + e * 0.18) * k;
      tr.scaleX *= s;
      tr.scaleY *= s;
      tr.x += Math.sin(e * Math.PI) * 40 * k;
      tr.y -= e * 26 * k;
      break;
    }

    case 'spin':
      tr.rotation += p * 360 * (a.loop ? 1 : easeInOut(p));
      break;

    case 'pulse': {
      const s = 1 + Math.sin(p * Math.PI * 2) * 0.09 * k;
      tr.scaleX *= s;
      tr.scaleY *= s;
      break;
    }

    case 'shake':
      tr.x += Math.sin(t * 47 + index) * 12 * k;
      tr.y += Math.cos(t * 61 + index * 2) * 9 * k;
      tr.rotation += Math.sin(t * 39) * 1.6 * k;
      break;

    case 'flicker':
      opacity = layer.opacity * (0.45 + 0.55 * Math.abs(noise(Math.floor(t * 22), index)));
      break;

    case 'glitch': {
      // Hold still, then tear sideways in short bursts — the irregular
      // rhythm is what sells it as a fault rather than an animation.
      const burst = Math.floor(t * 9) % 4 === 0;
      if (burst) {
        tr.x += (noise(Math.floor(t * 9), index) - 0.5) * 90 * k;
        tr.scaleX *= 1 + (noise(Math.floor(t * 9), index + 5) - 0.5) * 0.06 * k;
      }
      break;
    }

    case 'sweep': {
      // A specular pass reads as a scale-and-brighten cycle on the layer.
      const e = Math.sin(p * Math.PI);
      tr.scaleX *= 1 + e * 0.02 * k;
      tr.scaleY *= 1 + e * 0.02 * k;
      if (layer.kind === 'image') {
        return {
          ...layer,
          transform: tr,
          opacity,
          adjustments: {
            ...layer.adjustments,
            exposure: layer.adjustments.exposure + e * 22 * k,
            highlights: layer.adjustments.highlights + e * 18 * k,
          },
        };
      }
      break;
    }
  }

  return { ...layer, transform: tr, opacity } as Layer;
}

/** Longest end time across all layers, so exports are never cut short. */
export function timelineLength(doc: CanvasDoc): number {
  let max = 0;
  for (const l of doc.layers) {
    if (!l.anim || l.anim.kind === 'none') continue;
    max = Math.max(max, l.anim.delay + l.anim.duration);
  }
  return Math.max(1.5, max);
}

export function supportsVideoExport(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8'))
  );
}

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? 'video/webm';
}

/**
 * Encodes the timeline to WebM by driving a canvas stream frame by frame.
 *
 * requestFrame() is called explicitly rather than letting the stream capture
 * on its own clock, because compositing a 4K document can take longer than a
 * frame interval and an auto-capturing stream would silently drop frames or
 * duplicate them.
 */
export async function encodeVideo(
  doc: CanvasDoc,
  opts: {
    fps?: number;
    seconds?: number;
    width?: number;
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<Blob> {
  const { composite } = await import('./compositor');

  const fps = opts.fps ?? 30;
  const seconds = opts.seconds ?? timelineLength(doc);
  const scale = opts.width ? opts.width / doc.width : 1;

  const stage = document.createElement('canvas');
  stage.width = Math.round(doc.width * scale);
  stage.height = Math.round(doc.height * scale);
  const stageCtx = stage.getContext('2d')!;

  const frameCanvas = document.createElement('canvas');

  const stream = stage.captureStream(0);
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
  const chunks: BlobPart[] = [];

  const recorder = new MediaRecorder(stream, {
    mimeType: pickMimeType(),
    videoBitsPerSecond: 12_000_000,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  recorder.start();

  const total = Math.max(1, Math.round(seconds * fps));
  for (let i = 0; i < total; i++) {
    if (opts.signal?.aborted) break;
    const t = i / fps;
    composite(frameCanvas, docAtTime(doc, t));
    stageCtx.clearRect(0, 0, stage.width, stage.height);
    stageCtx.drawImage(frameCanvas, 0, 0, stage.width, stage.height);
    track.requestFrame();
    opts.onProgress?.((i + 1) / total);
    // Yield so the recorder can actually pull the frame it was just handed.
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();
  return done;
}
