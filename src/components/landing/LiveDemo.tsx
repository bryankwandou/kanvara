'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyPreset, PRESETS } from '@/engine/presets';
import { ImageRenderer } from '@/engine/renderer';
import { NEUTRAL, type Adjustments } from '@/engine/types';

const SHOWCASE = ['original', 'portra', 'teal-orange', 'trix', 'cinestill', 'neon', 'bleach', 'moonlit'];
const MAX_EDGE = 1400;

/**
 * The demo runs the shipping renderer on a photo the visitor supplies. There is
 * no bundled sample and no server round trip, which means the thing being
 * demonstrated is literally the product rather than a recording of it.
 */
export function LiveDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ImageRenderer | null>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [preset, setPreset] = useState('portra');
  const [strength, setStrength] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const draw = useCallback((presetId: string, amount: number) => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas || !sourceRef.current) return;

    const p = PRESETS.find((x) => x.id === presetId) ?? PRESETS[0];
    const adj: Adjustments = applyPreset({ ...NEUTRAL }, p, amount / 100);
    renderer.render(adj);

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(renderer.canvas as CanvasImageSource, 0, 0);
  }, []);

  const load = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
        const w = Math.round(bmp.width * scale);
        const h = Math.round(bmp.height * scale);

        const src = document.createElement('canvas');
        src.width = w;
        src.height = h;
        const sctx = src.getContext('2d')!;
        sctx.imageSmoothingQuality = 'high';
        sctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        sourceRef.current = src;

        if (!rendererRef.current) rendererRef.current = new ImageRenderer();
        rendererRef.current.setSource(src, w, h);

        const canvas = canvasRef.current!;
        canvas.width = w;
        canvas.height = h;
        setDims({ w, h });
        setReady(true);
        draw(preset, strength);
      } catch {
        setError('That file could not be read as an image.');
      }
    },
    [draw, preset, strength],
  );

  useEffect(() => {
    if (ready) draw(preset, strength);
  }, [ready, preset, strength, draw]);

  useEffect(() => () => rendererRef.current?.dispose(), []);

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) load(f);
        }}
        className={`relative overflow-hidden rounded-panel border transition-colors duration-200 ${
          dragging ? 'border-craft bg-craft/[0.05]' : 'border-line bg-surface-1'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-[12px] text-text-mid">
            {ready ? (
              <span className="tabular text-text-low">{dims.w} × {dims.h}</span>
            ) : (
              'Nothing loaded'
            )}
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-text-hi transition-colors hover:bg-surface-3"
          >
            {ready ? 'Use another photo' : 'Choose a photo'}
          </button>
        </div>

        <div className="checkerboard relative flex min-h-[340px] items-center justify-center p-5 sm:min-h-[440px]">
          {/* Kept mounted rather than conditionally rendered: the loader needs a
              real canvas element to size before the first frame exists. */}
          <canvas
            ref={canvasRef}
            className={`max-h-[440px] w-auto max-w-full rounded-md shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)] ${
              ready ? '' : 'hidden'
            }`}
          />
          {!ready && (
            <div className="max-w-[380px] px-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-panel border border-line bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mark.svg" alt="" className="size-8" />
              </div>
              <p className="text-[14px] font-medium text-text-hi">Drop a photo here</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-mid">
                It is decoded in this tab and rendered by the same shader the editor uses.
                Nothing is sent anywhere.
              </p>
              {error && <p className="mt-3 text-[12px] text-danger">{error}</p>}
            </div>
          )}
        </div>

        <div className="border-t border-line p-4">
          <div className="rail-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {SHOWCASE.map((id) => {
              const p = PRESETS.find((x) => x.id === id)!;
              const on = preset === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!ready}
                  onClick={() => {
                    setPreset(id);
                    setStrength(100);
                  }}
                  className={`shrink-0 rounded-md border px-3.5 py-1.5 text-[12px] transition-all duration-150 disabled:opacity-40 ${
                    on
                      ? 'border-craft bg-craft/10 text-craft'
                      : 'border-line bg-surface-2 text-text-mid hover:border-text-low hover:text-text-hi'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          <label className="mt-2 flex items-center gap-3">
            <span className="w-[58px] shrink-0 text-[11px] text-text-low">Strength</span>
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              disabled={!ready}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-craft disabled:opacity-40"
            />
            <span className="tabular w-[38px] shrink-0 text-right text-[11px] text-craft">{strength}%</span>
          </label>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) load(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
