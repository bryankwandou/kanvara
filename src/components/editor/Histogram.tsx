'use client';

import { useEffect, useRef, useState } from 'react';
import { composite } from '@/engine/compositor';
import { useDoc } from '@/engine/store';

const BINS = 128;
const SAMPLE = 220; // long edge of the canvas the histogram is read from

/**
 * Reading pixels back from the GPU is the expensive part, so the histogram is
 * computed from a 220px composite rather than the full document, and only
 * after edits have settled. At that size the shape is indistinguishable from
 * the real thing and it costs under a millisecond.
 */
export function Histogram() {
  const doc = useDoc();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clipping, setClipping] = useState({ shadows: 0, highlights: 0 });

  useEffect(() => {
    if (!doc.layers.length) return;

    const timer = setTimeout(() => {
      const scale = SAMPLE / Math.max(doc.width, doc.height);
      const w = Math.max(1, Math.round(doc.width * scale));
      const h = Math.max(1, Math.round(doc.height * scale));

      const full = document.createElement('canvas');
      composite(full, doc);

      const small = document.createElement('canvas');
      small.width = w;
      small.height = h;
      const sctx = small.getContext('2d', { willReadFrequently: true })!;
      sctx.drawImage(full, 0, 0, w, h);

      const data = sctx.getImageData(0, 0, w, h).data;
      const r = new Uint32Array(BINS);
      const g = new Uint32Array(BINS);
      const b = new Uint32Array(BINS);
      let dark = 0;
      let blown = 0;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 8) continue;
        const ri = (data[i] * (BINS - 1)) / 255;
        const gi = (data[i + 1] * (BINS - 1)) / 255;
        const bi = (data[i + 2] * (BINS - 1)) / 255;
        r[ri | 0]++;
        g[gi | 0]++;
        b[bi | 0]++;
        const l = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
        if (l < 2) dark++;
        else if (l > 253) blown++;
      }

      const total = w * h;
      setClipping({
        shadows: Math.round((dark / total) * 1000) / 10,
        highlights: Math.round((blown / total) * 1000) / 10,
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const chh = canvas.clientHeight;
      canvas.width = cw * dpr;
      canvas.height = chh * dpr;

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, chh);

      // Ignore the single tallest bin when scaling, otherwise one spike of
      // pure black flattens the entire rest of the plot.
      const peak = (arr: Uint32Array) => {
        const sorted = Array.from(arr).sort((x, y) => y - x);
        return Math.max(1, sorted[1] ?? sorted[0]);
      };
      const max = Math.max(peak(r), peak(g), peak(b));

      const plot = (arr: Uint32Array, colour: string) => {
        ctx.beginPath();
        ctx.moveTo(0, chh);
        for (let i = 0; i < BINS; i++) {
          const x = (i / (BINS - 1)) * cw;
          const y = chh - Math.min(1, arr[i] / max) * chh;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(cw, chh);
        ctx.closePath();
        ctx.fillStyle = colour;
        ctx.fill();
      };

      ctx.globalCompositeOperation = 'lighter';
      plot(r, 'rgba(255, 78, 78, 0.55)');
      plot(g, 'rgba(78, 220, 130, 0.55)');
      plot(b, 'rgba(90, 150, 255, 0.55)');
    }, 90);

    return () => clearTimeout(timer);
  }, [doc]);

  if (!doc.layers.length) return null;

  return (
    <div className="border-b border-line/60 px-4 py-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.08em] text-text-low">Histogram</span>
        <span className="tabular flex gap-2 text-[10.5px]">
          <span className={clipping.shadows > 1 ? 'text-craft' : 'text-text-low'}>
            {clipping.shadows}% clipped
          </span>
          <span className={clipping.highlights > 1 ? 'text-craft' : 'text-text-low'}>
            {clipping.highlights}% blown
          </span>
        </span>
      </div>
      <canvas ref={canvasRef} className="h-[64px] w-full rounded-md bg-surface-0" />
      <div className="mt-1 flex justify-between text-[9.5px] text-text-low">
        <span>Shadows</span>
        <span>Midtones</span>
        <span>Highlights</span>
      </div>
    </div>
  );
}
