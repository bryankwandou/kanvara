'use client';

import { Slider } from '@/components/ui/Slider';
import { invalidate } from '@/engine/compositor';
import {
  addDrawLayer,
  getBitmap,
  setBrush,
  setTool,
  updateLayer,
  useEditor,
  useSelected,
} from '@/engine/store';
import { Button, Field, PanelHeader, Section, Swatch } from './Shell';

const SIZES = [4, 12, 28, 48, 90, 160];

export function DrawPanel() {
  const brush = useEditor((s) => s.brush);
  const layer = useSelected();
  const onPaintLayer = layer?.kind === 'draw';

  const clear = () => {
    if (!layer || layer.kind !== 'draw') return;
    const c = getBitmap(layer.id) as HTMLCanvasElement | undefined;
    if (!c) return;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    invalidate(layer.id);
    updateLayer(layer.id, { name: layer.name });
  };

  return (
    <>
      <PanelHeader
        title="Paint"
        hint="Strokes land on their own layer, so they never touch the photo underneath."
        action={
          <Button
            variant="solid"
            onClick={() => {
              addDrawLayer();
              setTool('draw');
            }}
          >
            New layer
          </Button>
        }
      />

      {!onPaintLayer && (
        <div className="border-b border-line/60 bg-craft/5 px-4 py-2.5 text-[11px] leading-relaxed text-text-mid">
          Painting needs a paint layer. Create one above, or select an existing one.
        </div>
      )}

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        <Section title="Mode">
          <div className="grid grid-cols-2 gap-2">
            {(['paint', 'erase'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setBrush({ mode: m })}
                className={`rounded-md border px-3 py-2 text-[12px] capitalize transition-colors ${
                  brush.mode === m
                    ? 'border-craft bg-craft/10 text-craft'
                    : 'border-line bg-surface-2 text-text-mid hover:text-text-hi'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Brush">
          <div className="mb-3 flex items-end gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBrush({ size: s })}
                title={`${s} px`}
                className={`flex size-9 items-center justify-center rounded-md border transition-colors ${
                  brush.size === s ? 'border-craft bg-craft/10' : 'border-line bg-surface-2 hover:border-text-low'
                }`}
              >
                <span
                  className="rounded-full bg-text-mid"
                  style={{ width: Math.min(20, 3 + s / 8), height: Math.min(20, 3 + s / 8) }}
                />
              </button>
            ))}
          </div>

          <Slider label="Size" value={brush.size} min={1} max={400} origin={48} unit="px"
            onChange={(v) => setBrush({ size: v })} />
          <Slider label="Hardness" value={brush.hardness} min={0} max={100} origin={70} unit="%"
            onChange={(v) => setBrush({ hardness: v })} />
          <Slider label="Opacity" value={Math.round(brush.opacity * 100)} min={1} max={100} origin={100} unit="%"
            onChange={(v) => setBrush({ opacity: v / 100 })} />
        </Section>

        {brush.mode === 'paint' && (
          <Section title="Colour">
            <Field label="Brush colour">
              <Swatch value={brush.color} onChange={(v) => setBrush({ color: v })} />
            </Field>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['#ffffff', '#000000', '#ff9e2c', '#7c5cff', '#ff5c5c', '#3ddc84', '#4aa8ff', '#ffe14a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBrush({ color: c })}
                  style={{ background: c }}
                  className="size-6 rounded border border-line transition-transform hover:scale-110"
                  aria-label={c}
                />
              ))}
            </div>
          </Section>
        )}

        {onPaintLayer && (
          <Section title="Layer">
            <Button variant="danger" full onClick={clear}>
              Clear this paint layer
            </Button>
          </Section>
        )}
      </div>
    </>
  );
}
