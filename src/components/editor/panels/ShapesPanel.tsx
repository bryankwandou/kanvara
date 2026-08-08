'use client';

import { Slider } from '@/components/ui/Slider';
import { addShapeLayer, beginGesture, updateLayer, useSelected } from '@/engine/store';
import type { ShapeLayer } from '@/engine/types';
import { Field, PanelHeader, Section, Swatch } from './Shell';

const SHAPES: { id: ShapeLayer['shape']; label: string; path: string }[] = [
  { id: 'rect', label: 'Rectangle', path: 'M5 6h14v12H5z' },
  { id: 'ellipse', label: 'Ellipse', path: 'M12 5a7 7 0 110 14 7 7 0 010-14z' },
  { id: 'triangle', label: 'Triangle', path: 'M12 5l7 13H5z' },
  { id: 'star', label: 'Star', path: 'M12 4l2.4 5.2 5.6.7-4.2 3.8 1.2 5.5L12 16.4 6.9 19.2l1.2-5.5L4 9.9l5.6-.7z' },
  { id: 'heart', label: 'Heart', path: 'M12 19s-7-4.4-7-9a3.8 3.8 0 017-2 3.8 3.8 0 017 2c0 4.6-7 9-7 9z' },
  { id: 'line', label: 'Line', path: 'M4 12h16' },
];

export function ShapesPanel() {
  const layer = useSelected();
  const s = layer && layer.kind === 'shape' ? (layer as ShapeLayer) : null;

  const set = <K extends keyof ShapeLayer>(key: K, value: ShapeLayer[K], commit = true) => {
    if (!s) return;
    updateLayer<ShapeLayer>(s.id, { [key]: value } as Partial<ShapeLayer>, commit);
  };

  return (
    <>
      <PanelHeader title="Shapes" hint="Vector forms that stay sharp at any export size." />

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        <Section title="Insert">
          <div className="grid grid-cols-3 gap-2 pt-1">
            {SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => addShapeLayer(shape.id)}
                title={shape.label}
                className="group flex aspect-square items-center justify-center rounded-md border border-line bg-surface-2 text-text-mid transition-all duration-150 hover:border-craft/60 hover:bg-surface-3 hover:text-craft active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
                  <path d={shape.path} />
                </svg>
              </button>
            ))}
          </div>
        </Section>

        {s && (
          <>
            <Section title="Size">
              <Slider label="Width" value={s.width} min={8} max={4000} origin={s.width} unit="px"
                onCommitStart={beginGesture} onChange={(v) => set('width', v, false)} />
              <Slider label="Height" value={s.height} min={8} max={4000} origin={s.height} unit="px"
                onCommitStart={beginGesture} onChange={(v) => set('height', v, false)} />
              {s.shape === 'rect' && (
                <Slider label="Corner radius" value={s.cornerRadius} min={0} max={400} unit="px"
                  onCommitStart={beginGesture} onChange={(v) => set('cornerRadius', v, false)} />
              )}
            </Section>

            <Section title="Appearance">
              {s.shape !== 'line' && (
                <Field label="Fill"><Swatch value={s.fill} onChange={(v) => set('fill', v)} /></Field>
              )}
              <Slider label="Stroke width" value={s.strokeWidth} min={0} max={80} unit="px"
                onCommitStart={beginGesture} onChange={(v) => set('strokeWidth', v, false)} />
              {s.strokeWidth > 0 && (
                <Field label="Stroke"><Swatch value={s.stroke} onChange={(v) => set('stroke', v)} /></Field>
              )}
            </Section>
          </>
        )}
      </div>
    </>
  );
}
