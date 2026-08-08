'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from '@/components/editor/Stage';
import { TOOL_SHORTCUTS, ToolRail } from '@/components/editor/ToolRail';
import { TopBar } from '@/components/editor/TopBar';
import { AdjustPanel } from '@/components/editor/panels/AdjustPanel';
import { CropPanel } from '@/components/editor/panels/CropPanel';
import { CutoutPanel } from '@/components/editor/panels/CutoutPanel';
import { DrawPanel } from '@/components/editor/panels/DrawPanel';
import { EffectsPanel } from '@/components/editor/panels/EffectsPanel';
import { ExportPanel } from '@/components/editor/panels/ExportPanel';
import { FiltersPanel } from '@/components/editor/panels/FiltersPanel';
import { LayersPanel } from '@/components/editor/panels/LayersPanel';
import { MotionPanel } from '@/components/editor/panels/MotionPanel';
import { ShapesPanel } from '@/components/editor/panels/ShapesPanel';
import { TextPanel } from '@/components/editor/panels/TextPanel';
import {
  addImageLayer,
  duplicateLayer,
  newDocument,
  readState,
  redo,
  removeLayer,
  setTool,
  undo,
  useDoc,
  useEditor,
} from '@/engine/store';

const PANELS = {
  adjust: AdjustPanel,
  filters: FiltersPanel,
  crop: CropPanel,
  effects: EffectsPanel,
  cutout: CutoutPanel,
  text: TextPanel,
  draw: DrawPanel,
  shapes: ShapesPanel,
  animate: MotionPanel,
  layers: LayersPanel,
  export: ExportPanel,
  select: LayersPanel,
} as const;

export default function EditPage() {
  const tool = useEditor((s) => s.tool);
  const doc = useDoc();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const Panel = PANELS[tool] ?? AdjustPanel;

  const loadFiles = useCallback(async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;

    for (const [i, file] of images.entries()) {
      const bmp = await createImageBitmap(file);
      // The first photo defines the canvas; anything after it is placed on top.
      if (i === 0 && readState().doc.layers.length === 0) {
        newDocument(bmp.width, bmp.height, null);
      }
      addImageLayer(bmp, file.name.replace(/\.[^.]+$/, ''));
    }
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) loadFiles(e.target.files);
    e.target.value = '';
  };

  // Paste, drop and the file picker all funnel into the same loader, so a
  // screenshot from the clipboard behaves exactly like a file from disk.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.files;
      if (items?.length) {
        e.preventDefault();
        loadFiles(items);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFiles]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileRef.current?.click();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        const id = readState().doc.selectedId;
        if (id) {
          e.preventDefault();
          duplicateLayer(id);
        }
        return;
      }

      if (typing || mod) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const id = readState().doc.selectedId;
        if (id) {
          e.preventDefault();
          removeLayer(id);
        }
        return;
      }

      const t = TOOL_SHORTCUTS[e.key.toLowerCase()];
      if (t) {
        e.preventDefault();
        setTool(t);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const empty = doc.layers.length === 0;

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-surface-0"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        loadFiles(e.dataTransfer.files);
      }}
    >
      <TopBar onOpen={() => fileRef.current?.click()} />

      <div className="flex min-h-0 flex-1">
        <ToolRail />

        <aside className="flex w-[312px] shrink-0 flex-col border-r border-line bg-surface-1">
          <Panel />
        </aside>

        <main className="relative flex min-w-0 flex-1">
          <Stage />

          {empty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="pointer-events-auto max-w-[420px] rounded-panel border border-line bg-surface-1/95 p-8 text-center backdrop-blur">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mark.svg" alt="" className="mx-auto size-12 opacity-90" />
                <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">Open a photo to begin</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-text-mid">
                  Drop a file anywhere on this window, paste from the clipboard, or browse your
                  disk. The image is read locally and stays on this machine.
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-5 rounded-md bg-craft px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-craft-soft"
                >
                  Choose a file
                </button>
                <p className="mt-4 text-[11px] text-text-low">
                  JPEG, PNG, WebP, GIF, AVIF and HEIC where the browser supports it
                </p>
              </div>
            </div>
          )}

          {dragOver && (
            <div className="pointer-events-none absolute inset-3 z-20 rounded-panel border-2 border-dashed border-craft/70 bg-craft/[0.06]" />
          )}
        </main>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
