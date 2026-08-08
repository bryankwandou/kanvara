'use client';

import { Slider } from '@/components/ui/Slider';
import { beginGesture, updateLayer, useSelected } from '@/engine/store';
import { BLEND_MODES, IDENTITY_TRANSFORM, type BlendMode } from '@/engine/types';
import { Button, EmptyState, Field, inputClass, PanelHeader, Section } from './Shell';

export function EffectsPanel() {
  const layer = useSelected();

  if (!layer) {
    return (
      <>
        <PanelHeader title="Transform" hint="Position, rotation, perspective and blending." />
        <EmptyState text="Select a layer to move it in space." />
      </>
    );
  }

  const t = layer.transform;
  const setT = (patch: Partial<typeof t>, commit = false) =>
    updateLayer(layer.id, { transform: { ...t, ...patch } }, commit);

  return (
    <>
      <PanelHeader
        title="Transform"
        hint="Tilt applies a real vanishing point, not a shear."
        action={
          <Button
            onClick={() => {
              beginGesture();
              updateLayer(layer.id, { transform: { ...IDENTITY_TRANSFORM } }, false);
            }}
          >
            Reset
          </Button>
        }
      />

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        <Section title="Position">
          <Slider label="Offset X" value={t.x} min={-2000} max={2000} unit="px"
            onCommitStart={beginGesture} onChange={(v) => setT({ x: v })} />
          <Slider label="Offset Y" value={t.y} min={-2000} max={2000} unit="px"
            onCommitStart={beginGesture} onChange={(v) => setT({ y: v })} />
          <Slider label="Rotation" value={t.rotation} min={-180} max={180} unit="°"
            onCommitStart={beginGesture} onChange={(v) => setT({ rotation: v })} />
        </Section>

        <Section title="Scale">
          <Slider label="Scale X" value={Math.round(t.scaleX * 100)} min={-400} max={400} origin={100} unit="%"
            onCommitStart={beginGesture} onChange={(v) => setT({ scaleX: v / 100 })} />
          <Slider label="Scale Y" value={Math.round(t.scaleY * 100)} min={-400} max={400} origin={100} unit="%"
            onCommitStart={beginGesture} onChange={(v) => setT({ scaleY: v / 100 })} />

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button full onClick={() => { beginGesture(); setT({ scaleX: -t.scaleX }, false); }}>
              Flip horizontal
            </Button>
            <Button full onClick={() => { beginGesture(); setT({ scaleY: -t.scaleY }, false); }}>
              Flip vertical
            </Button>
          </div>
        </Section>

        <Section title="Perspective">
          <p className="mb-2 text-[11px] leading-relaxed text-text-low">
            The layer is sliced and each slice scaled by its own depth, so the far edge really
            does get smaller.
          </p>
          <Slider label="Tilt X" value={t.tiltX} min={-70} max={70} unit="°"
            onCommitStart={beginGesture} onChange={(v) => setT({ tiltX: v })} />
          <Slider label="Tilt Y" value={t.tiltY} min={-70} max={70} unit="°"
            onCommitStart={beginGesture} onChange={(v) => setT({ tiltY: v })} />
        </Section>

        <Section title="Blending">
          <Field label="Blend mode">
            <select
              value={layer.blend}
              onChange={(e) => updateLayer(layer.id, { blend: e.target.value as BlendMode })}
              className={inputClass}
            >
              {BLEND_MODES.map((m) => (
                <option key={m} value={m}>
                  {m.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </Field>
          <Slider label="Opacity" value={Math.round(layer.opacity * 100)} min={0} max={100} origin={100} unit="%"
            onCommitStart={beginGesture} onChange={(v) => updateLayer(layer.id, { opacity: v / 100 }, false)} />
        </Section>
      </div>
    </>
  );
}
