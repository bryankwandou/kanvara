import { applyPerspective } from './perspective';
import { getRenderer } from './renderer';
import { getBitmap } from './store';
import type { CanvasDoc, ImageLayer, Layer, ShapeLayer, TextLayer } from './types';

/**
 * Re-running the GPU pipeline for every layer on every frame is wasteful when
 * only one layer's sliders are moving. Keyed on the layer id plus a hash of
 * its adjustments, so an untouched layer is drawn straight from its last
 * result and only the layer being edited actually re-renders.
 */
const cache = new Map<string, { key: string; canvas: HTMLCanvasElement }>();

function adjustKey(l: ImageLayer): string {
  return Object.values(l.adjustments).join(',');
}

function renderImageLayer(layer: ImageLayer): CanvasImageSource | null {
  const src = getBitmap(layer.id);
  if (!src) return null;

  const key = adjustKey(layer);
  const hit = cache.get(layer.id);
  if (hit && hit.key === key) return hit.canvas;

  const renderer = getRenderer();
  renderer.setSource(src as TexImageSource, layer.width, layer.height);
  renderer.render(layer.adjustments);

  // Copy off the shared WebGL canvas immediately — the next layer's render
  // overwrites it.
  const out = document.createElement('canvas');
  out.width = layer.width;
  out.height = layer.height;
  out.getContext('2d')!.drawImage(renderer.canvas as CanvasImageSource, 0, 0);

  cache.set(layer.id, { key, canvas: out });
  return out;
}

export function invalidate(layerId?: string) {
  if (layerId) cache.delete(layerId);
  else cache.clear();
}

function roundRectPath(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + rr, -h / 2);
  ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, rr);
  ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, rr);
  ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, rr);
  ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, rr);
  ctx.closePath();
}

function shapePath(ctx: CanvasRenderingContext2D, l: ShapeLayer) {
  const { width: w, height: h } = l;
  switch (l.shape) {
    case 'rect':
      roundRectPath(ctx, w, h, l.cornerRadius);
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2, 0);
      break;
    case 'star': {
      const spikes = 5;
      const outer = Math.min(w, h) / 2;
      const inner = outer * 0.42;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i * Math.PI) / spikes - Math.PI / 2;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      break;
    }
    case 'heart': {
      const s = Math.min(w, h) / 2;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.75);
      ctx.bezierCurveTo(-s * 1.6, -s * 0.25, -s * 0.5, -s * 1.15, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.5, -s * 1.15, s * 1.6, -s * 0.25, 0, s * 0.75);
      ctx.closePath();
      break;
    }
  }
}

function drawText(ctx: CanvasRenderingContext2D, l: TextLayer) {
  const style = l.italic ? 'italic ' : '';
  ctx.font = `${style}${l.fontWeight} ${l.fontSize}px ${l.fontFamily}, Inter, sans-serif`;
  ctx.textAlign = l.align;
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${l.letterSpacing}px`;

  ctx.shadowColor = l.shadowBlur > 0 || l.shadowOffsetX || l.shadowOffsetY ? l.shadowColor : 'transparent';
  ctx.shadowBlur = l.shadowBlur;
  ctx.shadowOffsetX = l.shadowOffsetX;
  ctx.shadowOffsetY = l.shadowOffsetY;

  const lines = l.text.split('\n');
  const lineH = l.fontSize * l.lineHeight;
  const startY = -((lines.length - 1) * lineH) / 2;

  const paint = (glyph: string, x: number, y: number) => {
    if (l.strokeWidth > 0) {
      ctx.lineWidth = l.strokeWidth;
      ctx.strokeStyle = l.strokeColor;
      ctx.lineJoin = 'round';
      ctx.strokeText(glyph, x, y);
    }
    ctx.fillStyle = l.color;
    ctx.fillText(glyph, x, y);
  };

  if (Math.abs(l.curve) < 0.5) {
    lines.forEach((line, i) => paint(line, 0, startY + i * lineH));
    return;
  }

  // Arc text: lay each glyph along a circle whose radius comes from the curve
  // amount, so 100 wraps tightly and 1 is almost flat.
  const radius = (l.fontSize * 900) / Math.abs(l.curve);
  const dir = l.curve > 0 ? 1 : -1;
  ctx.textAlign = 'center';

  lines.forEach((line, li) => {
    const chars = [...line];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let angle = -(total / radius) / 2;
    const yBase = startY + li * lineH;

    for (let i = 0; i < chars.length; i++) {
      const step = widths[i] / radius;
      angle += step / 2;
      ctx.save();
      ctx.translate(Math.sin(angle) * radius, dir * (radius - Math.cos(angle) * radius) + yBase);
      ctx.rotate(dir * angle);
      paint(chars[i], 0, 0);
      ctx.restore();
      angle += step / 2;
    }
  });
}

function drawLayer(ctx: CanvasRenderingContext2D, doc: CanvasDoc, layer: Layer) {
  if (!layer.visible || layer.opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = layer.blend as GlobalCompositeOperation;

  const t = layer.transform;
  ctx.translate(doc.width / 2 + t.x, doc.height / 2 + t.y);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.scale(t.scaleX, t.scaleY);

  if (layer.kind === 'image' || layer.kind === 'draw') {
    const src =
      layer.kind === 'image'
        ? renderImageLayer(layer)
        : (getBitmap(layer.id) as CanvasImageSource | undefined) ?? null;
    if (src) {
      const w = layer.width;
      const h = layer.height;
      const finished = applyPerspective(src, w, h, t.tiltX, t.tiltY);
      ctx.drawImage(finished, -w / 2, -h / 2, w, h);
    }
  } else if (layer.kind === 'text') {
    drawText(ctx, layer);
  } else if (layer.kind === 'shape') {
    shapePath(ctx, layer);
    if (layer.shape !== 'line') {
      ctx.fillStyle = layer.fill;
      ctx.fill();
    }
    if (layer.strokeWidth > 0) {
      ctx.lineWidth = layer.strokeWidth;
      ctx.strokeStyle = layer.stroke;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/** Draws the whole document at its native resolution into `target`. */
export function composite(target: HTMLCanvasElement, doc: CanvasDoc) {
  target.width = doc.width;
  target.height = doc.height;
  const ctx = target.getContext('2d')!;
  ctx.clearRect(0, 0, doc.width, doc.height);

  if (doc.background) {
    ctx.fillStyle = doc.background;
    ctx.fillRect(0, 0, doc.width, doc.height);
  }

  for (const layer of doc.layers) drawLayer(ctx, doc, layer);
}

/** Off-screen composite, used by export and by the animation encoder. */
export function compositeToNew(doc: CanvasDoc): HTMLCanvasElement {
  const c = document.createElement('canvas');
  composite(c, doc);
  return c;
}
