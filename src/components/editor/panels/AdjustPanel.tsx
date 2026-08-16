'use client';

import { Histogram } from '@/components/editor/Histogram';
import { Slider } from '@/components/ui/Slider';
import { invalidate } from '@/engine/compositor';
import { beginGesture, updateLayer, useSelected } from '@/engine/store';
import { ADJUSTMENT_GROUPS, NEUTRAL, type Adjustments, type ImageLayer } from '@/engine/types';
import { Button, EmptyState, PanelHeader, Section } from './Shell';

export function AdjustPanel() {
  const layer = useSelected();

  if (!layer || layer.kind !== 'image') {
    return (
      <>
        <PanelHeader title="Adjust" hint="Tone and colour, applied non-destructively." />
        <EmptyState text="Select an image layer to adjust it. Text, shapes and paint layers use their own controls." />
      </>
    );
  }

  const img = layer as ImageLayer;
  const changed = (Object.keys(NEUTRAL) as (keyof Adjustments)[]).filter(
    (k) => img.adjustments[k] !== NEUTRAL[k],
  ).length;

  const setValue = (key: keyof Adjustments, value: number) => {
    updateLayer<ImageLayer>(
      img.id,
      { adjustments: { ...img.adjustments, [key]: value }, presetId: null },
      false,
    );
    invalidate(img.id);
  };

  const resetAll = () => {
    beginGesture();
    updateLayer<ImageLayer>(img.id, { adjustments: { ...NEUTRAL }, presetId: null }, false);
    invalidate(img.id);
  };

  return (
    <>
      <PanelHeader
        title="Adjust"
        hint="Every slider is live. Nothing is baked into the pixels until you export."
        action={
          <Button onClick={resetAll} disabled={changed === 0} title="Reset every slider">
            Reset
          </Button>
        }
      />

      <Histogram />

      {changed > 0 && (
        <div className="border-b border-line/60 px-4 py-2 text-[11px] text-text-low">
          <span className="tabular text-craft">{changed}</span> control
          {changed === 1 ? '' : 's'} moved from neutral
        </div>
      )}

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        {ADJUSTMENT_GROUPS.map((group) => (
          <Section key={group.label} title={group.label}>
            {group.keys.map((k) => (
              <Slider
                key={k.key}
                label={k.label}
                value={img.adjustments[k.key]}
                min={k.min}
                max={k.max}
                origin={k.min === 0 ? 0 : 0}
                unit={k.key === 'hue' ? '°' : ''}
                onCommitStart={beginGesture}
                onChange={(v) => setValue(k.key, v)}
              />
            ))}
          </Section>
        ))}
      </div>
    </>
  );
}
