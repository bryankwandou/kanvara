'use client';

import { Slider } from '@/components/ui/Slider';
import { addTextLayer, beginGesture, updateLayer, useSelected } from '@/engine/store';
import type { TextLayer } from '@/engine/types';
import { Button, Field, inputClass, PanelHeader, Section, Swatch } from './Shell';

/** Web-safe plus the two the app already loads, so nothing renders as a fallback. */
const FONTS = [
  'Inter',
  'JetBrains Mono',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Palatino',
  'Garamond',
];

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

export function TextPanel() {
  const layer = useSelected();
  const t = layer && layer.kind === 'text' ? (layer as TextLayer) : null;

  const set = <K extends keyof TextLayer>(key: K, value: TextLayer[K], commit = true) => {
    if (!t) return;
    updateLayer<TextLayer>(t.id, { [key]: value } as Partial<TextLayer>, commit);
  };

  return (
    <>
      <PanelHeader
        title="Text"
        hint="Type on the layer, then shape it. Arc, stroke and shadow are all live."
        action={<Button variant="solid" onClick={() => addTextLayer('Your words')}>Add</Button>}
      />

      {!t ? (
        <div className="px-4 py-10 text-center text-[12px] leading-relaxed text-text-low">
          No text layer selected. Add one, or pick an existing text layer from the canvas.
        </div>
      ) : (
        <div className="rail-scroll flex-1 overflow-y-auto pb-8">
          <Section title="Content">
            <textarea
              value={t.text}
              onChange={(e) => set('text', e.target.value, false)}
              onBlur={beginGesture}
              rows={3}
              className={`${inputClass} resize-y leading-snug`}
              placeholder="Type here"
            />
          </Section>

          <Section title="Typeface">
            <Field label="Family">
              <select value={t.fontFamily} onChange={(e) => set('fontFamily', e.target.value)} className={inputClass}>
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Weight">
                <select
                  value={t.fontWeight}
                  onChange={(e) => set('fontWeight', Number(e.target.value))}
                  className={inputClass}
                >
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </Field>
              <Field label="Alignment">
                <select
                  value={t.align}
                  onChange={(e) => set('align', e.target.value as TextLayer['align'])}
                  className={inputClass}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
            </div>

            <label className="flex items-center gap-2 py-1 text-[12px] text-text-mid">
              <input
                type="checkbox"
                checked={t.italic}
                onChange={(e) => set('italic', e.target.checked)}
                className="accent-craft"
              />
              Italic
            </label>

            <Slider label="Size" value={t.fontSize} min={8} max={600} origin={t.fontSize} unit="px"
              onCommitStart={beginGesture} onChange={(v) => set('fontSize', v, false)} />
            <Slider label="Letter spacing" value={t.letterSpacing} min={-20} max={80} unit="px"
              onCommitStart={beginGesture} onChange={(v) => set('letterSpacing', v, false)} />
            <Slider label="Line height" value={Math.round(t.lineHeight * 100)} min={60} max={260} origin={115} unit="%"
              onCommitStart={beginGesture} onChange={(v) => set('lineHeight', v / 100, false)} />
            <Slider label="Arc" value={t.curve} min={-100} max={100}
              onCommitStart={beginGesture} onChange={(v) => set('curve', v, false)} />
          </Section>

          <Section title="Fill and outline">
            <Field label="Colour"><Swatch value={t.color} onChange={(v) => set('color', v)} /></Field>
            <Slider label="Outline width" value={t.strokeWidth} min={0} max={40} unit="px"
              onCommitStart={beginGesture} onChange={(v) => set('strokeWidth', v, false)} />
            {t.strokeWidth > 0 && (
              <Field label="Outline colour"><Swatch value={t.strokeColor} onChange={(v) => set('strokeColor', v)} /></Field>
            )}
          </Section>

          <Section title="Shadow" defaultOpen={false}>
            <Field label="Colour"><Swatch value={t.shadowColor} onChange={(v) => set('shadowColor', v)} /></Field>
            <Slider label="Blur" value={t.shadowBlur} min={0} max={120} unit="px"
              onCommitStart={beginGesture} onChange={(v) => set('shadowBlur', v, false)} />
            <Slider label="Offset X" value={t.shadowOffsetX} min={-100} max={100} unit="px"
              onCommitStart={beginGesture} onChange={(v) => set('shadowOffsetX', v, false)} />
            <Slider label="Offset Y" value={t.shadowOffsetY} min={-100} max={100} unit="px"
              onCommitStart={beginGesture} onChange={(v) => set('shadowOffsetY', v, false)} />
          </Section>
        </div>
      )}
    </>
  );
}
