'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/Slider';
import { invalidate } from '@/engine/compositor';
import { removeBackgroundFrom, removeColour } from '@/engine/cutout';
import { addImageLayer, beginGesture, getBitmap, putBitmap, updateLayer, useSelected } from '@/engine/store';
import type { ImageLayer } from '@/engine/types';
import { Button, EmptyState, Field, PanelHeader, Section, Swatch } from './Shell';

export function CutoutPanel() {
  const layer = useSelected();
  const img = layer && layer.kind === 'image' ? (layer as ImageLayer) : null;

  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyColour, setKeyColour] = useState('#00ff00');
  const [tolerance, setTolerance] = useState(18);
  const [feather, setFeather] = useState(20);

  const replaceBitmap = (canvas: HTMLCanvasElement) => {
    if (!img) return;
    beginGesture();
    putBitmap(img.id, canvas);
    invalidate(img.id);
    updateLayer<ImageLayer>(img.id, { width: canvas.width, height: canvas.height }, false);
  };

  const runModel = async () => {
    if (!img) return;
    const source = getBitmap(img.id);
    if (!source) return;
    setError(null);
    setProgress(0);
    try {
      const out = await removeBackgroundFrom(
        source as CanvasImageSource,
        img.width,
        img.height,
        (f) => setProgress(f),
      );
      replaceBitmap(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The cutout could not be completed.');
    } finally {
      setProgress(null);
    }
  };

  const runChroma = () => {
    if (!img) return;
    const source = getBitmap(img.id);
    if (!source) return;
    const hex = keyColour.replace('#', '');
    const rgb: [number, number, number] = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
    replaceBitmap(removeColour(source as CanvasImageSource, img.width, img.height, rgb, tolerance, feather));
  };

  const addBackdrop = (colour: string) => {
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1600;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, c.width, c.height);
    const created = addImageLayer(c, 'Backdrop');
    // Send it behind everything, which is the only place a backdrop is useful.
    updateLayer(created.id, { name: 'Backdrop' });
  };

  if (!img) {
    return (
      <>
        <PanelHeader title="Cut out" hint="Separate a subject from what is behind it." />
        <EmptyState text="Select an image layer to cut it out." />
      </>
    );
  }

  return (
    <>
      <PanelHeader
        title="Cut out"
        hint="Runs on your machine. The photo is never uploaded anywhere."
      />

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        <Section title="Automatic">
          <p className="mb-3 text-[11px] leading-relaxed text-text-low">
            A segmentation model finds the subject and builds the matte. The first run downloads
            the model, roughly 40&nbsp;MB; after that it works with the network off.
          </p>

          <Button variant="assist" full onClick={runModel} disabled={progress !== null}>
            {progress === null ? 'Remove background' : `Working ${Math.round(progress * 100)}%`}
          </Button>

          {progress !== null && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-assist transition-[width] duration-200"
                style={{ width: `${Math.max(4, progress * 100)}%` }}
              />
            </div>
          )}

          {error && <p className="mt-2 text-[11px] leading-relaxed text-danger">{error}</p>}
        </Section>

        <Section title="By colour" defaultOpen={false}>
          <p className="mb-3 text-[11px] leading-relaxed text-text-low">
            Faster and more precise when the subject sits on a flat studio backdrop.
          </p>
          <Field label="Colour to drop"><Swatch value={keyColour} onChange={setKeyColour} /></Field>
          <Slider label="Tolerance" value={tolerance} min={0} max={100} origin={18} unit="%" onChange={setTolerance} />
          <Slider label="Edge feather" value={feather} min={0} max={100} origin={20} unit="%" onChange={setFeather} />
          <Button full onClick={runChroma}>Drop that colour</Button>
        </Section>

        <Section title="Put something behind it" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {['#ffffff', '#000000', '#f2e9dc', '#0b0b0d', '#ff9e2c', '#7c5cff', '#3ddc84', '#4aa8ff'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => addBackdrop(c)}
                style={{ background: c }}
                className="size-7 rounded border border-line transition-transform hover:scale-110"
                aria-label={`Add ${c} backdrop`}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-text-low">
            Added as its own layer. Drag it below the subject in the Layers panel.
          </p>
        </Section>
      </div>
    </>
  );
}
