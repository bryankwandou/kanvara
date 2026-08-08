'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Slider } from '@/components/ui/Slider';
import { invalidate } from '@/engine/compositor';
import { applyPreset, PRESETS, PRESET_GROUPS, type Preset } from '@/engine/presets';
import { ImageRenderer } from '@/engine/renderer';
import { beginGesture, getBitmap, updateLayer, useSelected } from '@/engine/store';
import { NEUTRAL, type ImageLayer } from '@/engine/types';
import { EmptyState, PanelHeader, Section } from './Shell';

const THUMB = 132;

/**
 * Each preset gets a thumbnail of the user's own photo rather than a stock
 * swatch, because "what does Portra do to *this* picture" is the only question
 * the panel is actually being asked. They are generated once per source image
 * on a dedicated renderer so they never fight the main canvas for the context.
 */
function usePresetThumbnails(layer: ImageLayer | null) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const rendererRef = useRef<ImageRenderer | null>(null);

  useEffect(() => {
    if (!layer) return;
    const source = getBitmap(layer.id);
    if (!source) return;

    let cancelled = false;

    // Downscale first: filtering a 24MP photo 38 times to make 132px chips
    // would stall the tab for seconds.
    const ratio = layer.width / layer.height;
    const tw = Math.round(ratio >= 1 ? THUMB : THUMB * ratio);
    const th = Math.round(ratio >= 1 ? THUMB / ratio : THUMB);

    const small = document.createElement('canvas');
    small.width = tw;
    small.height = th;
    const sctx = small.getContext('2d')!;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(source as CanvasImageSource, 0, 0, tw, th);

    if (!rendererRef.current) rendererRef.current = new ImageRenderer();
    const renderer = rendererRef.current;
    renderer.setSource(small, tw, th);

    const out: Record<string, string> = {};
    let i = 0;

    // Spread the work across frames so the panel paints progressively
    // instead of blocking on all 38 at once.
    const step = () => {
      if (cancelled) return;
      const end = Math.min(i + 5, PRESETS.length);
      for (; i < end; i++) {
        const preset = PRESETS[i];
        renderer.render(applyPreset({ ...NEUTRAL }, preset, 1));
        out[preset.id] = (renderer.canvas as HTMLCanvasElement).toDataURL('image/jpeg', 0.72);
      }
      setThumbs({ ...out });
      if (i < PRESETS.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    return () => {
      cancelled = true;
    };
  }, [layer?.id, layer?.width, layer?.height]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => rendererRef.current?.dispose(), []);

  return thumbs;
}

export function FiltersPanel() {
  const layer = useSelected();
  const img = layer && layer.kind === 'image' ? (layer as ImageLayer) : null;
  const thumbs = usePresetThumbnails(img);
  const [strength, setStrength] = useState(100);

  const grouped = useMemo(
    () => PRESET_GROUPS.map((g) => ({ group: g, items: PRESETS.filter((p) => p.group === g) })),
    [],
  );

  if (!img) {
    return (
      <>
        <PanelHeader title="Looks" hint="Colour grades built from the same sliders you already have." />
        <EmptyState text="Select an image layer to browse looks." />
      </>
    );
  }

  const apply = (preset: Preset, s = strength) => {
    beginGesture();
    updateLayer<ImageLayer>(
      img.id,
      {
        adjustments: applyPreset({ ...NEUTRAL }, preset, s / 100),
        presetId: preset.id === 'original' ? null : preset.id,
      },
      false,
    );
    invalidate(img.id);
  };

  const active = PRESETS.find((p) => p.id === img.presetId) ?? null;

  return (
    <>
      <PanelHeader
        title="Looks"
        hint="Each one is a starting point. Move any slider afterwards and it stays yours."
      />

      {active && (
        <div className="border-b border-line/60 px-4 py-1">
          <Slider
            label={`${active.name} strength`}
            value={strength}
            min={0}
            max={100}
            origin={100}
            unit="%"
            onCommitStart={beginGesture}
            onChange={(v) => {
              setStrength(v);
              apply(active, v);
            }}
          />
        </div>
      )}

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        {grouped.map(({ group, items }) => (
          <Section key={group} title={group}>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {items.map((preset) => {
                const selected = (img.presetId ?? 'original') === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setStrength(100);
                      apply(preset, 100);
                    }}
                    className="group text-left"
                  >
                    <div
                      className={`relative aspect-square overflow-hidden rounded-md border transition-all duration-150 ${
                        selected
                          ? 'border-craft ring-1 ring-craft/40'
                          : 'border-line group-hover:border-text-low'
                      }`}
                    >
                      {thumbs[preset.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbs[preset.id]}
                          alt=""
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                        />
                      ) : (
                        <div className="size-full animate-pulse bg-surface-3" />
                      )}
                    </div>
                    <span
                      className={`mt-1 block truncate text-[10.5px] ${
                        selected ? 'text-craft' : 'text-text-low group-hover:text-text-mid'
                      }`}
                    >
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>
        ))}
      </div>
    </>
  );
}
