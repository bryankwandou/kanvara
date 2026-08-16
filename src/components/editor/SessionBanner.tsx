'use client';

import { useEffect, useRef, useState } from 'react';
import { invalidate } from '@/engine/compositor';
import { clearSession, loadSession, saveSession } from '@/engine/persist';
import { loadDocument, readBitmaps, readState, useDoc } from '@/engine/store';
import type { CanvasDoc } from '@/engine/types';

const IDLE_MS = 2500;

function ago(then: number) {
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'moments ago';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

type Offer = { doc: CanvasDoc; bitmaps: Record<string, HTMLCanvasElement>; savedAt: number };

/**
 * Nothing is uploaded, so the only thing standing between an hour of work and a
 * stray Ctrl+W is this. The write is idle-triggered rather than on every edit —
 * encoding layer PNGs mid-drag would stutter the canvas.
 */
export function SessionBanner() {
  const doc = useDoc();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const dismissed = useRef(false);
  const writing = useRef(false);

  useEffect(() => {
    let live = true;
    loadSession().then((found) => {
      // Only offer if the canvas is still empty — restoring over work in
      // progress would be worse than losing the older session.
      if (live && found && readState().doc.layers.length === 0) setOffer(found);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!doc.layers.length) return;
    const timer = setTimeout(async () => {
      if (writing.current) return;
      writing.current = true;
      try {
        await saveSession(readState().doc, readBitmaps());
        setSaved(Date.now());
      } catch {
        // Private browsing and full quotas both land here. Autosave is a
        // convenience; failing it quietly beats interrupting the edit.
      } finally {
        writing.current = false;
      }
    }, IDLE_MS);
    return () => clearTimeout(timer);
  }, [doc]);

  if (offer && !dismissed.current) {
    const layers = offer.doc.layers.length;
    return (
      <div className="pointer-events-auto absolute left-1/2 top-4 z-30 w-[380px] -translate-x-1/2 rounded-panel border border-line bg-surface-1/95 p-4 shadow-lift backdrop-blur">
        <p className="text-[13px] font-medium text-text-hi">Pick up where you left off?</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-text-mid">
          {layers} layer{layers === 1 ? '' : 's'} were still open on this machine {ago(offer.savedAt)}.
          Nothing left the browser.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              loadDocument(offer.doc, offer.bitmaps);
              invalidate();
              setOffer(null);
            }}
            className="rounded-md bg-craft px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-craft-soft"
          >
            Restore it
          </button>
          <button
            type="button"
            onClick={() => {
              dismissed.current = true;
              clearSession();
              setOffer(null);
            }}
            className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-text-mid transition-colors hover:text-text-hi"
          >
            Start fresh
          </button>
        </div>
      </div>
    );
  }

  if (!saved) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-[10.5px] text-text-low">
      Saved locally {ago(saved)}
    </div>
  );
}
