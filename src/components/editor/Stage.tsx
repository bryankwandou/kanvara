'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { docAtTime } from '@/engine/animate';
import { composite, invalidate } from '@/engine/compositor';
import {
  beginGesture,
  getBitmap,
  readState,
  selectLayer,
  setCrop,
  setZoom,
  updateLayer,
  useEditor,
} from '@/engine/store';
import { NEUTRAL, type Layer } from '@/engine/types';

type Handle = 'nw' | 'ne' | 'se' | 'sw' | 'rot' | null;

/** Axis-aligned bounds of a layer in document space, ignoring rotation. */
function layerBox(doc: { width: number; height: number }, l: Layer) {
  const w = ('width' in l ? l.width : l.kind === 'text' ? l.fontSize * Math.max(4, l.text.length * 0.55) : 200) * l.transform.scaleX;
  const h = ('height' in l ? l.height : l.kind === 'text' ? l.fontSize * l.lineHeight * (l.text.split('\n').length + 0.4) : 200) * l.transform.scaleY;
  return {
    cx: doc.width / 2 + l.transform.x,
    cy: doc.height / 2 + l.transform.y,
    w: Math.abs(w),
    h: Math.abs(h),
  };
}

export function Stage() {
  const doc = useEditor((s) => s.doc);
  const tool = useEditor((s) => s.tool);
  const zoom = useEditor((s) => s.zoom);
  const brush = useEditor((s) => s.brush);
  const crop = useEditor((s) => s.crop);
  const playhead = useEditor((s) => s.playhead);
  const compare = useEditor((s) => s.compare);

  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fit, setFit] = useState(1);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const gesture = useRef<{
    type: 'none' | 'pan' | 'move' | 'scale' | 'rotate' | 'paint' | 'crop';
    handle: Handle;
    startX: number;
    startY: number;
    origin: Layer | null;
    lastDoc: { x: number; y: number } | null;
    cropStart: { x: number; y: number } | null;
  }>({ type: 'none', handle: null, startX: 0, startY: 0, origin: null, lastDoc: null, cropStart: null });

  // Fit the document to the viewport whenever either one changes size.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
      const pad = 72;
      setFit(Math.min((r.width - pad) / doc.width, (r.height - pad) / doc.height, 1.6));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [doc.width, doc.height]);

  const scale = fit * zoom;
  const viewW = doc.width * scale;
  const viewH = doc.height * scale;

  const toDoc = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = viewRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const r = canvas.getBoundingClientRect();
      return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
    },
    [scale],
  );

  // Redraw whenever anything visible changes. Compositing at document
  // resolution once and then scaling the result keeps zooming free.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !box.w) return;

    if (!bufferRef.current) bufferRef.current = document.createElement('canvas');
    const buffer = bufferRef.current;

    let frameDoc = playhead === null ? doc : docAtTime(doc, playhead);

    // Hold-to-compare strips the grade off image layers only; text, shapes and
    // paint stay put so the comparison isolates the colour work.
    if (compare) {
      frameDoc = {
        ...frameDoc,
        layers: frameDoc.layers.map((l) =>
          l.kind === 'image' ? { ...l, adjustments: { ...NEUTRAL } } : l,
        ),
      };
    }

    composite(buffer, frameDoc);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.width = Math.round(viewW * dpr);
    view.height = Math.round(viewH * dpr);
    view.style.width = `${viewW}px`;
    view.style.height = `${viewH}px`;

    const ctx = view.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buffer, 0, 0, viewW, viewH);
  }, [doc, viewW, viewH, box.w, playhead, compare]);

  const selected = doc.layers.find((l) => l.id === doc.selectedId) ?? null;

  function hitTest(x: number, y: number): Layer | null {
    for (let i = doc.layers.length - 1; i >= 0; i--) {
      const l = doc.layers[i];
      if (!l.visible || l.locked) continue;
      const b = layerBox(doc, l);
      if (Math.abs(x - b.cx) <= b.w / 2 && Math.abs(y - b.cy) <= b.h / 2) return l;
    }
    return null;
  }

  function paintAt(p: { x: number; y: number }, from: { x: number; y: number } | null) {
    if (!selected || selected.kind !== 'draw') return;
    const target = getBitmap(selected.id) as HTMLCanvasElement | undefined;
    if (!target) return;
    const ctx = target.getContext('2d')!;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brush.size;
    ctx.globalAlpha = brush.opacity;

    if (brush.mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      // Hardness below 100 is a soft edge, which a plain stroke cannot do;
      // a radial gradient stamp along the segment gives a real falloff.
      if (brush.hardness >= 99) {
        ctx.strokeStyle = brush.color;
      } else {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, brush.size / 2);
        g.addColorStop(Math.max(0, brush.hardness / 100 - 0.02), brush.color);
        g.addColorStop(1, `${brush.color}00`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, brush.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
    }

    ctx.beginPath();
    if (from) {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(p.x, p.y);
    } else {
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y);
    }
    ctx.stroke();
    ctx.restore();

    invalidate(selected.id);
    // Nudge the store so the stage repaints without adding an undo step.
    updateLayer(selected.id, { name: selected.name }, false);
  }

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const p = toDoc(e.clientX, e.clientY);
    const g = gesture.current;
    g.startX = e.clientX;
    g.startY = e.clientY;

    // Middle mouse or Alt always pans, regardless of the active tool, so
    // there is always a way to move around without changing tools.
    if (e.button === 1 || e.altKey) {
      g.type = 'pan';
      return;
    }

    if (tool === 'crop') {
      g.type = 'crop';
      g.cropStart = p;
      setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
      return;
    }

    if (tool === 'draw' && selected?.kind === 'draw') {
      beginGesture();
      g.type = 'paint';
      g.lastDoc = p;
      paintAt(p, null);
      return;
    }

    const hit = hitTest(p.x, p.y);
    if (hit) {
      if (hit.id !== doc.selectedId) selectLayer(hit.id);
      beginGesture();
      g.type = 'move';
      g.origin = hit;
    } else {
      selectLayer(null);
      g.type = 'pan';
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.type === 'none') return;

    if (g.type === 'pan') {
      setPan((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }

    if (g.type === 'paint') {
      const p = toDoc(e.clientX, e.clientY);
      paintAt(p, g.lastDoc);
      g.lastDoc = p;
      return;
    }

    if (g.type === 'crop' && g.cropStart) {
      const p = toDoc(e.clientX, e.clientY);
      setCrop({
        x: Math.min(g.cropStart.x, p.x),
        y: Math.min(g.cropStart.y, p.y),
        w: Math.abs(p.x - g.cropStart.x),
        h: Math.abs(p.y - g.cropStart.y),
      });
      return;
    }

    if (g.type === 'move' && g.origin) {
      const dx = (e.clientX - g.startX) / scale;
      const dy = (e.clientY - g.startY) / scale;
      updateLayer(
        g.origin.id,
        {
          transform: {
            ...g.origin.transform,
            x: Math.round(g.origin.transform.x + dx),
            y: Math.round(g.origin.transform.y + dy),
          },
        },
        false,
      );
    }

    if (g.type === 'scale' && g.origin) {
      const b = layerBox(doc, g.origin);
      const p = toDoc(e.clientX, e.clientY);
      const half = Math.max(8, Math.hypot(p.x - b.cx, p.y - b.cy));
      const ref = Math.hypot(b.w / 2, b.h / 2) / (g.origin.transform.scaleX || 1);
      const next = Math.max(0.04, half / Math.max(1, ref));
      updateLayer(
        g.origin.id,
        {
          transform: {
            ...g.origin.transform,
            scaleX: e.shiftKey ? next : next,
            scaleY: next,
          },
        },
        false,
      );
    }

    if (g.type === 'rotate' && g.origin) {
      const b = layerBox(doc, g.origin);
      const p = toDoc(e.clientX, e.clientY);
      const deg = (Math.atan2(p.y - b.cy, p.x - b.cx) * 180) / Math.PI + 90;
      updateLayer(
        g.origin.id,
        { transform: { ...g.origin.transform, rotation: e.shiftKey ? Math.round(deg / 15) * 15 : Math.round(deg) } },
        false,
      );
    }
  };

  const onPointerUp = () => {
    gesture.current = { type: 'none', handle: null, startX: 0, startY: 0, origin: null, lastDoc: null, cropStart: null };
  };

  const startHandle = (handle: Handle) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (!selected) return;
    beginGesture();
    gesture.current = {
      type: handle === 'rot' ? 'rotate' : 'scale',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origin: selected,
      lastDoc: null,
      cropStart: null,
    };
  };

  // Ctrl/⌘ + wheel zooms, plain wheel pans, which is the convention every
  // desktop editor already trained people on.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(readState().zoom * (e.deltaY < 0 ? 1.1 : 0.9));
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, []);

  const sel = selected ? layerBox(doc, selected) : null;
  const cursor =
    tool === 'draw' && selected?.kind === 'draw' ? 'crosshair' : tool === 'crop' ? 'crosshair' : 'default';

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 overflow-hidden bg-surface-0"
      style={{ cursor }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))` }}
      >
        <div
          className="relative checkerboard shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)]"
          style={{ width: viewW, height: viewH }}
        >
          <canvas
            ref={viewRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="block touch-none"
          />

          {/* Selection frame. Drawn in DOM rather than on the canvas so it
              stays exactly 1px at every zoom level. */}
          {sel && tool !== 'crop' && (
            <div
              className="pointer-events-none absolute border border-craft/90"
              style={{
                left: (sel.cx - sel.w / 2) * scale,
                top: (sel.cy - sel.h / 2) * scale,
                width: sel.w * scale,
                height: sel.h * scale,
                transform: `rotate(${selected!.transform.rotation}deg)`,
              }}
            >
              {(['nw', 'ne', 'se', 'sw'] as const).map((h) => (
                <span
                  key={h}
                  onPointerDown={startHandle(h)}
                  className="pointer-events-auto absolute size-[9px] -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-[2px] border border-black/50 bg-craft"
                  style={{
                    left: h.includes('w') ? 0 : '100%',
                    top: h.includes('n') ? 0 : '100%',
                  }}
                />
              ))}
              <span
                onPointerDown={startHandle('rot')}
                className="pointer-events-auto absolute left-1/2 size-[11px] -translate-x-1/2 cursor-grab rounded-full border border-black/50 bg-assist"
                style={{ top: -26 }}
              />
            </div>
          )}

          {crop && tool === 'crop' && crop.w > 2 && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-black/60" />
              <div
                className="pointer-events-none absolute border border-craft"
                style={{
                  left: crop.x * scale,
                  top: crop.y * scale,
                  width: crop.w * scale,
                  height: crop.h * scale,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.0)',
                  background: 'transparent',
                  mixBlendMode: 'normal',
                }}
              >
                <div className="absolute inset-0 backdrop-brightness-[1.9]" />
                {/* Rule-of-thirds guides, the one overlay that actually
                    changes how people crop. */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {compare && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-craft/60 bg-surface-1/95 px-3.5 py-1.5 text-[11px] font-medium text-craft backdrop-blur">
          Showing the original
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-line bg-surface-1/90 px-3 py-1.5 text-[11px] text-text-mid backdrop-blur">
        <span className="tabular">{doc.width} × {doc.height}</span>
        <span className="text-line">|</span>
        <span className="tabular">{Math.round(scale * 100)}%</span>
        <span className="text-line">|</span>
        <span className="tabular">{doc.layers.length} layer{doc.layers.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}
