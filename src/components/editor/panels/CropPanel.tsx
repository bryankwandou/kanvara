'use client';

import { useState } from 'react';
import { edit, setCrop, useDoc, useEditor } from '@/engine/store';
import { Button, PanelHeader, Section } from './Shell';

const RATIOS: { label: string; value: number | null }[] = [
  { label: 'Free', value: null },
  { label: 'Square', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:3', value: 2 / 3 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:1', value: 3 },
];

export function CropPanel() {
  const doc = useDoc();
  const crop = useEditor((s) => s.crop);
  const [ratio, setRatio] = useState<number | null>(null);

  const applyRatio = (r: number | null) => {
    setRatio(r);
    if (r === null) return;
    // Fit the largest rectangle of that ratio inside the document and centre it.
    let w = doc.width;
    let h = w / r;
    if (h > doc.height) {
      h = doc.height;
      w = h * r;
    }
    setCrop({ x: (doc.width - w) / 2, y: (doc.height - h) / 2, w, h });
  };

  const commitCrop = () => {
    if (!crop || crop.w < 4 || crop.h < 4) return;
    const w = Math.round(crop.w);
    const h = Math.round(crop.h);
    // Everything is positioned relative to the document centre, so moving the
    // frame means shifting every layer by the same delta.
    const dx = doc.width / 2 - (crop.x + crop.w / 2);
    const dy = doc.height / 2 - (crop.y + crop.h / 2);

    edit((d) => ({
      ...d,
      width: w,
      height: h,
      layers: d.layers.map((l) => ({
        ...l,
        transform: { ...l.transform, x: l.transform.x + dx, y: l.transform.y + dy },
      })),
    }));
    setCrop(null);
  };

  const rotateDoc = (deg: 90 | -90) => {
    edit((d) => ({
      ...d,
      width: d.height,
      height: d.width,
      layers: d.layers.map((l) => ({
        ...l,
        transform: {
          ...l.transform,
          rotation: l.transform.rotation + deg,
          x: deg === 90 ? -l.transform.y : l.transform.y,
          y: deg === 90 ? l.transform.x : -l.transform.x,
        },
      })),
    }));
  };

  const flipDoc = (axis: 'x' | 'y') => {
    edit((d) => ({
      ...d,
      layers: d.layers.map((l) => ({
        ...l,
        transform: {
          ...l.transform,
          scaleX: axis === 'x' ? -l.transform.scaleX : l.transform.scaleX,
          scaleY: axis === 'y' ? -l.transform.scaleY : l.transform.scaleY,
          x: axis === 'x' ? -l.transform.x : l.transform.x,
          y: axis === 'y' ? -l.transform.y : l.transform.y,
        },
      })),
    }));
  };

  return (
    <>
      <PanelHeader
        title="Crop"
        hint="Drag on the canvas to draw a frame, or pick a ratio below."
        action={
          crop ? (
            <Button variant="solid" onClick={commitCrop}>Apply</Button>
          ) : undefined
        }
      />

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        <Section title="Aspect ratio">
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => applyRatio(r.value)}
                className={`rounded-md border px-2 py-2 text-[12px] transition-colors ${
                  ratio === r.value
                    ? 'border-craft bg-craft/10 text-craft'
                    : 'border-line bg-surface-2 text-text-mid hover:text-text-hi'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Section>

        {crop && (
          <Section title="Frame">
            <dl className="space-y-1 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-text-low">Position</dt>
                <dd className="tabular text-text-mid">{Math.round(crop.x)}, {Math.round(crop.y)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-low">Size</dt>
                <dd className="tabular text-text-mid">{Math.round(crop.w)} × {Math.round(crop.h)}</dd>
              </div>
            </dl>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button full onClick={() => setCrop(null)}>Discard</Button>
              <Button variant="solid" full onClick={commitCrop}>Apply crop</Button>
            </div>
          </Section>
        )}

        <Section title="Whole canvas">
          <div className="grid grid-cols-2 gap-2">
            <Button full onClick={() => rotateDoc(-90)}>Rotate left</Button>
            <Button full onClick={() => rotateDoc(90)}>Rotate right</Button>
            <Button full onClick={() => flipDoc('x')}>Flip horizontal</Button>
            <Button full onClick={() => flipDoc('y')}>Flip vertical</Button>
          </div>
        </Section>
      </div>
    </>
  );
}
