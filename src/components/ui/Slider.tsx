'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Where the track's "no change" marker sits. Defaults to 0 for bipolar ranges. */
  origin?: number;
  unit?: string;
  onChange: (value: number) => void;
  /** Fired once when a drag starts, so the caller can open one undo step. */
  onCommitStart?: () => void;
};

/**
 * The slider carries most of the interaction weight in an editor, so it does
 * more than a range input: the fill grows from the neutral point rather than
 * from the left edge (which is what makes -40 contrast read as "less" at a
 * glance), holding Shift drops to a fifth of the speed for fine work, and
 * double-clicking the label snaps back to neutral without hunting for the
 * exact pixel.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  origin = 0,
  unit = '',
  onChange,
  onCommitStart,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startX: 0, startValue: 0 });

  const span = max - min;
  const pct = (v: number) => ((v - min) / span) * 100;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const quantise = (v: number) => Math.round(v / step) * step;

  const originPct = pct(Math.min(Math.max(origin, min), max));
  const valuePct = pct(value);
  const fillLeft = Math.min(originPct, valuePct);
  const fillWidth = Math.abs(valuePct - originPct);

  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    onCommitStart?.();
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);

    const rect = track.getBoundingClientRect();
    const jumped = clamp(quantise(min + ((e.clientX - rect.left) / rect.width) * span));
    drag.current = { startX: e.clientX, startValue: jumped };
    onChange(jumped);
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const speed = e.shiftKey ? 0.2 : 1;
      const delta = ((e.clientX - drag.current.startX) / rect.width) * span * speed;
      onChange(clamp(quantise(drag.current.startValue + delta)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, span, step, min, max],
  );

  const onPointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer was already released */
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onCommitStart?.();
      onChange(clamp(quantise(value + step * big)));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onCommitStart?.();
      onChange(clamp(quantise(value - step * big)));
    } else if (e.key === 'Home') {
      onCommitStart?.();
      onChange(origin);
    }
  };

  const reset = () => {
    onCommitStart?.();
    onChange(clamp(origin));
  };

  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [dragging]);

  const touched = Math.abs(value - origin) > 0.001;

  return (
    <div className="group select-none py-2">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <button
          type="button"
          onDoubleClick={reset}
          className="text-[13px] text-text-mid transition-colors group-hover:text-text-hi"
          title="Double-click to reset"
        >
          {label}
        </button>
        <span
          className={`tabular text-[12px] ${touched ? 'text-craft' : 'text-text-low'}`}
          aria-live="off"
        >
          {value > 0 && origin === 0 ? '+' : ''}
          {Math.round(value)}
          {unit}
        </span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={min}
        aria-valuemax={max}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={reset}
        className="relative h-6 cursor-ew-resize touch-none"
      >
        <div className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-surface-3" />
        {origin > min && origin < max && (
          <div
            className="absolute top-1/2 h-[9px] w-px -translate-y-1/2 bg-line"
            style={{ left: `${originPct}%` }}
          />
        )}
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-craft transition-[background] duration-150"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <div
          className={`absolute top-1/2 size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40 bg-text-hi shadow-[0_1px_4px_rgba(0,0,0,0.6)] transition-transform duration-100 ${
            dragging ? 'scale-125' : 'group-hover:scale-110'
          }`}
          style={{ left: `${valuePct}%` }}
        />
      </div>
    </div>
  );
}
