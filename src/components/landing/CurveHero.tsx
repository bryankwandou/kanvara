'use client';

import { useEffect, useRef, useState } from 'react';

const W = 320;
const H = 320;

/**
 * An editable tone curve, drawn from the same geometry as the logo. It is not
 * decoration: dragging the two control points really does redraw the curve and
 * the strip below it, so the first thing a visitor touches on the page is the
 * idea the whole product is built on.
 */
export function CurveHero() {
  const [lo, setLo] = useState({ x: 0.3, y: 0.36 });
  const [hi, setHi] = useState({ x: 0.7, y: 0.64 });
  const [dragging, setDragging] = useState<'lo' | 'hi' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!dragging) return;

    const move = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const x = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width));
      const y = Math.min(0.95, Math.max(0.05, 1 - (e.clientY - r.top) / r.height));
      if (dragging === 'lo') setLo({ x: Math.min(x, hi.x - 0.06), y });
      else setHi({ x: Math.max(x, lo.x + 0.06), y });
    };
    const up = () => setDragging(null);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging, lo.x, hi.x]);

  const px = (p: { x: number; y: number }) => ({ x: p.x * W, y: (1 - p.y) * H });
  const a = px(lo);
  const b = px(hi);
  const path = `M0 ${H} C ${a.x} ${a.y}, ${b.x} ${b.y}, ${W} 0`;

  // Sample the curve so the strip underneath shows what it actually does.
  const bezier = (t: number) => {
    const mt = 1 - t;
    return mt ** 3 * 0 + 3 * mt ** 2 * t * lo.y + 3 * mt * t ** 2 * hi.y + t ** 3 * 1;
  };
  const steps = Array.from({ length: 22 }, (_, i) => bezier(i / 21));

  return (
    <div className="w-full max-w-[380px]">
      <div className="rounded-panel border border-line bg-surface-1 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.09em] text-text-low">Tone curve</span>
          <span className="tabular text-[11px] text-craft">
            {Math.round(lo.y * 100)} / {Math.round(hi.y * 100)}
          </span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="aspect-square w-full touch-none rounded-md bg-surface-0"
        >
          <defs>
            <linearGradient id="hero-curve" x1="0" y1={H} x2={W} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7c5cff" />
              <stop offset="0.55" stopColor="#ff9e2c" />
              <stop offset="1" stopColor="#ffc46b" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g} stroke="#2e2e36" strokeWidth={1}>
              <line x1={g * W} y1={0} x2={g * W} y2={H} />
              <line x1={0} y1={g * H} x2={W} y2={g * H} />
            </g>
          ))}
          <line x1={0} y1={H} x2={W} y2={0} stroke="#2e2e36" strokeWidth={1} strokeDasharray="4 5" />

          <path d={path} fill="none" stroke="url(#hero-curve)" strokeWidth={3} strokeLinecap="round" />

          {([['lo', a, lo] as const, ['hi', b, hi] as const]).map(([key, pos]) => (
            <circle
              key={key}
              cx={pos.x}
              cy={pos.y}
              r={dragging === key ? 11 : 8}
              fill="#f2f2f4"
              stroke="#0b0b0d"
              strokeWidth={2}
              className="cursor-grab transition-[r] duration-150 active:cursor-grabbing"
              onPointerDown={() => setDragging(key)}
            />
          ))}
        </svg>

        <div className="mt-3 flex h-9 overflow-hidden rounded-md">
          {steps.map((v, i) => (
            <div
              key={i}
              className="flex-1 transition-colors duration-100"
              style={{ background: `rgb(${v * 255} ${v * 255} ${v * 255})` }}
            />
          ))}
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-text-low">
          Drag either point. The strip below is the greyscale ramp after the curve is applied.
        </p>
      </div>
    </div>
  );
}
