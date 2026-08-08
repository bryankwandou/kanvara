'use client';

import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/Slider';
import {
  download,
  estimateBytes,
  FORMATS,
  humanBytes,
  renderExport,
  SIZE_PRESETS,
  type ExportFormat,
} from '@/engine/export';
import { useDoc } from '@/engine/store';
import { Button, Field, inputClass, PanelHeader, Section } from './Shell';

export function ExportPanel() {
  const doc = useDoc();
  const [format, setFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState(92);
  const [width, setWidth] = useState(doc.width);
  const [height, setHeight] = useState(doc.height);
  const [linked, setLinked] = useState(true);
  const [matte, setMatte] = useState('#ffffff');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const meta = FORMATS.find((f) => f.id === format)!;
  const aspect = doc.width / doc.height;

  const estimate = useMemo(
    () => estimateBytes(width, height, format, quality / 100),
    [width, height, format, quality],
  );

  const setW = (w: number) => {
    setWidth(w);
    if (linked) setHeight(Math.max(1, Math.round(w / aspect)));
  };
  const setH = (h: number) => {
    setHeight(h);
    if (linked) setWidth(Math.max(1, Math.round(h * aspect)));
  };

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const blob = await renderExport(doc, {
        format,
        quality: quality / 100,
        width,
        height,
        matte,
      });
      download(blob, `kanvara-${Date.now()}.${meta.ext}`);
      setNote(`Saved ${humanBytes(blob.size)}.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PanelHeader
        title="Export"
        hint="Full resolution, no watermark, nothing stamped on top."
      />

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        <Section title="Format">
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`rounded-md border px-2 py-2 text-[12px] transition-colors ${
                  format === f.id
                    ? 'border-craft bg-craft/10 text-craft'
                    : 'border-line bg-surface-2 text-text-mid hover:text-text-hi'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-text-low">
            {format === 'image/png' && 'Lossless, keeps transparency. Largest file.'}
            {format === 'image/jpeg' && 'Smallest for photographs. Transparency is flattened.'}
            {format === 'image/webp' && 'Keeps transparency at roughly a third of PNG size.'}
          </p>
        </Section>

        {format !== 'image/png' && (
          <Section title="Quality">
            <Slider label="Quality" value={quality} min={30} max={100} origin={92} unit="%"
              onChange={setQuality} />
          </Section>
        )}

        {!meta.alpha && (
          <Section title="Behind transparency" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {['#ffffff', '#000000', '#f2e9dc', '#0b0b0d'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setMatte(c)}
                  style={{ background: c }}
                  className={`size-7 rounded border transition-transform hover:scale-110 ${
                    matte === c ? 'border-craft' : 'border-line'
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </Section>
        )}

        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width">
              <input
                type="number"
                value={width}
                onChange={(e) => setW(Math.max(1, Number(e.target.value)))}
                className={`${inputClass} tabular`}
              />
            </Field>
            <Field label="Height">
              <input
                type="number"
                value={height}
                onChange={(e) => setH(Math.max(1, Number(e.target.value)))}
                className={`${inputClass} tabular`}
              />
            </Field>
          </div>

          <label className="mb-3 flex items-center gap-2 text-[12px] text-text-mid">
            <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} className="accent-craft" />
            Keep proportions
          </label>

          <div className="flex flex-wrap gap-1.5">
            {[25, 50, 100, 200].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setWidth(Math.round((doc.width * p) / 100));
                  setHeight(Math.round((doc.height * p) / 100));
                }}
                className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-text-mid transition-colors hover:bg-surface-3 hover:text-text-hi"
              >
                {p}%
              </button>
            ))}
          </div>
        </Section>

        <Section title="Common sizes" defaultOpen={false}>
          <div className="space-y-1">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setLinked(false);
                  setWidth(p.w);
                  setHeight(p.h);
                }}
                className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-left text-[12px] text-text-mid transition-colors hover:border-line hover:bg-surface-2 hover:text-text-hi"
              >
                <span>{p.label}</span>
                <span className="tabular text-[10.5px] text-text-low">{p.w}×{p.h}</span>
              </button>
            ))}
          </div>
        </Section>

        <div className="sticky bottom-0 border-t border-line bg-surface-1/95 p-4 backdrop-blur">
          <div className="mb-2.5 flex items-baseline justify-between text-[11px]">
            <span className="text-text-low">Estimated file</span>
            <span className="tabular text-text-mid">{humanBytes(estimate)}</span>
          </div>
          <Button variant="solid" full onClick={save} disabled={saving}>
            {saving ? 'Rendering…' : `Save ${meta.label}`}
          </Button>
          {note && <p className="mt-2 text-center text-[11px] text-text-mid">{note}</p>}
        </div>
      </div>
    </>
  );
}
