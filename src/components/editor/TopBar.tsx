'use client';

import Link from 'next/link';
import { IconPlus, IconRedo, IconReset, IconUndo } from '@/components/ui/Icons';
import { redo, setZoom, undo, useEditor } from '@/engine/store';

export function TopBar({ onOpen }: { onOpen: () => void }) {
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const zoom = useEditor((s) => s.zoom);
  const busy = useEditor((s) => s.busy);

  const iconBtn =
    'flex size-8 items-center justify-center rounded-md text-text-mid transition-colors hover:bg-surface-2 hover:text-text-hi disabled:pointer-events-none disabled:text-text-low/50';

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface-1 px-3">
      <Link href="/" className="flex items-center gap-2.5 rounded-md px-1 py-1 transition-opacity hover:opacity-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark.svg" alt="" className="size-7" />
        <span className="text-[14px] font-semibold tracking-[-0.02em]">Kanvara</span>
      </Link>

      <div className="mx-1 h-6 w-px bg-line" />

      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-text-hi transition-colors hover:bg-surface-3"
      >
        <IconPlus className="size-[14px]" />
        Open photo
      </button>

      <div className="flex items-center gap-0.5">
        <button type="button" onClick={undo} disabled={!canUndo} title="Undo  ·  Ctrl+Z" className={iconBtn}>
          <IconUndo />
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} title="Redo  ·  Ctrl+Shift+Z" className={iconBtn}>
          <IconRedo />
        </button>
      </div>

      <div className="flex-1" />

      {busy && (
        <span className="flex items-center gap-2 text-[12px] text-text-mid">
          <span className="size-1.5 animate-pulse rounded-full bg-assist" />
          {busy}
        </span>
      )}

      <div className="flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1 py-0.5">
        <button
          type="button"
          onClick={() => setZoom(zoom * 0.8)}
          className="px-2 py-1 text-[13px] leading-none text-text-mid transition-colors hover:text-text-hi"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="tabular w-[52px] text-[11px] text-text-mid transition-colors hover:text-text-hi"
          title="Fit to view"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom(zoom * 1.25)}
          className="px-2 py-1 text-[13px] leading-none text-text-mid transition-colors hover:text-text-hi"
          title="Zoom in"
        >
          +
        </button>
      </div>

      <button type="button" onClick={() => setZoom(1)} title="Reset zoom" className={iconBtn}>
        <IconReset />
      </button>
    </header>
  );
}
