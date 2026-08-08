'use client';

import { Slider } from '@/components/ui/Slider';
import {
  IconCopy,
  IconEye,
  IconEyeOff,
  IconImage,
  IconLock,
  IconShapes,
  IconText,
  IconTrash,
  IconUnlock,
  IconBrush,
} from '@/components/ui/Icons';
import {
  beginGesture,
  duplicateLayer,
  removeLayer,
  reorderLayer,
  selectLayer,
  updateLayer,
  useDoc,
} from '@/engine/store';
import type { Layer } from '@/engine/types';
import { EmptyState, PanelHeader, Section } from './Shell';

function kindIcon(l: Layer) {
  const cls = 'size-[15px]';
  if (l.kind === 'text') return <IconText className={cls} />;
  if (l.kind === 'shape') return <IconShapes className={cls} />;
  if (l.kind === 'draw') return <IconBrush className={cls} />;
  return <IconImage className={cls} />;
}

export function LayersPanel() {
  const doc = useDoc();
  const selected = doc.layers.find((l) => l.id === doc.selectedId) ?? null;

  return (
    <>
      <PanelHeader title="Layers" hint="Topmost in the list sits in front on the canvas." />

      {doc.layers.length === 0 ? (
        <EmptyState text="Nothing here yet. Open a photo, or add text, a shape, or a paint layer." />
      ) : (
        <div className="rail-scroll flex-1 overflow-y-auto pb-8">
          <div className="p-2">
            {/* Reversed so the visual order matches the stacking order. */}
            {[...doc.layers].reverse().map((l) => {
              const active = l.id === doc.selectedId;
              return (
                <div
                  key={l.id}
                  onClick={() => selectLayer(l.id)}
                  className={`group mb-1 flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 transition-colors ${
                    active
                      ? 'border-craft/60 bg-craft/[0.07]'
                      : 'border-transparent hover:border-line hover:bg-surface-2'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(l.id, { visible: !l.visible });
                    }}
                    className={`shrink-0 transition-colors ${l.visible ? 'text-text-mid hover:text-text-hi' : 'text-text-low'}`}
                    title={l.visible ? 'Hide' : 'Show'}
                  >
                    {l.visible ? <IconEye className="size-[15px]" /> : <IconEyeOff className="size-[15px]" />}
                  </button>

                  <span className={`shrink-0 ${active ? 'text-craft' : 'text-text-low'}`}>{kindIcon(l)}</span>

                  <input
                    value={l.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateLayer(l.id, { name: e.target.value }, false)}
                    onBlur={beginGesture}
                    className="min-w-0 flex-1 truncate border-0 bg-transparent text-[12px] text-text-hi outline-none"
                  />

                  <span className="tabular shrink-0 text-[10px] text-text-low">
                    {Math.round(l.opacity * 100)}%
                  </span>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { locked: !l.locked }); }}
                      className="rounded p-1 text-text-low hover:bg-surface-3 hover:text-text-mid"
                      title={l.locked ? 'Unlock' : 'Lock'}
                    >
                      {l.locked ? <IconLock className="size-[13px]" /> : <IconUnlock className="size-[13px]" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }}
                      className="rounded p-1 text-text-low hover:bg-surface-3 hover:text-text-mid"
                      title="Duplicate"
                    >
                      <IconCopy className="size-[13px]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                      className="rounded p-1 text-text-low hover:bg-danger/15 hover:text-danger"
                      title="Delete"
                    >
                      <IconTrash className="size-[13px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <Section title="Selected layer">
              <Slider
                label="Opacity"
                value={Math.round(selected.opacity * 100)}
                min={0}
                max={100}
                origin={100}
                unit="%"
                onCommitStart={beginGesture}
                onChange={(v) => updateLayer(selected.id, { opacity: v / 100 }, false)}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => reorderLayer(selected.id, 1)}
                  className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-text-mid transition-colors hover:bg-surface-3 hover:text-text-hi"
                >
                  Bring forward
                </button>
                <button
                  type="button"
                  onClick={() => reorderLayer(selected.id, -1)}
                  className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-text-mid transition-colors hover:bg-surface-3 hover:text-text-hi"
                >
                  Send backward
                </button>
              </div>
            </Section>
          )}
        </div>
      )}
    </>
  );
}
