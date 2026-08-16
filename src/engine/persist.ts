import type { CanvasDoc } from './types';

/**
 * The session is held in IndexedDB rather than localStorage because layer
 * bitmaps are stored as Blobs, and localStorage would need them base64-encoded
 * into a five-megabyte string budget. A single 12-megapixel layer would
 * already blow past that.
 *
 * This is a crash guard, not a file format. It keeps one slot, overwritten as
 * you work, so closing the tab by accident does not cost the edit.
 */
const DB_NAME = 'kanvara';
const STORE = 'session';
const KEY = 'current';
const VERSION = 1;

type Stored = {
  doc: CanvasDoc;
  bitmaps: Record<string, Blob>;
  savedAt: number;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB is unavailable.'));
  });
}

function toBlob(source: CanvasImageSource & { width: number; height: number }): Promise<Blob | null> {
  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  c.getContext('2d')!.drawImage(source, 0, 0);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

export async function saveSession(
  doc: CanvasDoc,
  read: (id: string) => (CanvasImageSource & { width: number; height: number }) | undefined,
): Promise<void> {
  const bitmaps: Record<string, Blob> = {};
  for (const layer of doc.layers) {
    const src = read(layer.id);
    if (!src) continue;
    const blob = await toBlob(src);
    if (blob) bitmaps[layer.id] = blob;
  }

  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ doc, bitmaps, savedAt: Date.now() } satisfies Stored, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadSession(): Promise<{ doc: CanvasDoc; bitmaps: Record<string, HTMLCanvasElement>; savedAt: number } | null> {
  let stored: Stored | undefined;
  try {
    const db = await open();
    stored = await new Promise<Stored | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result as Stored | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    return null;
  }

  if (!stored?.doc?.layers?.length) return null;

  const bitmaps: Record<string, HTMLCanvasElement> = {};
  for (const [id, blob] of Object.entries(stored.bitmaps)) {
    try {
      const bmp = await createImageBitmap(blob);
      const c = document.createElement('canvas');
      c.width = bmp.width;
      c.height = bmp.height;
      c.getContext('2d')!.drawImage(bmp, 0, 0);
      bmp.close();
      bitmaps[id] = c;
    } catch {
      // A layer whose bitmap failed to decode is skipped rather than
      // aborting the whole restore — partial recovery beats none.
    }
  }

  return { doc: stored.doc, bitmaps, savedAt: stored.savedAt };
}

export async function clearSession(): Promise<void> {
  try {
    const db = await open();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    db.close();
  } catch {
    /* nothing to clear */
  }
}

/** Serialises the whole project to a single file the user can keep. */
export async function exportProject(
  doc: CanvasDoc,
  read: (id: string) => (CanvasImageSource & { width: number; height: number }) | undefined,
): Promise<Blob> {
  const bitmaps: Record<string, string> = {};
  for (const layer of doc.layers) {
    const src = read(layer.id);
    if (!src) continue;
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')!.drawImage(src, 0, 0);
    bitmaps[layer.id] = c.toDataURL('image/png');
  }
  return new Blob([JSON.stringify({ version: 1, doc, bitmaps })], { type: 'application/json' });
}

export async function importProject(
  file: File,
): Promise<{ doc: CanvasDoc; bitmaps: Record<string, HTMLCanvasElement> }> {
  const parsed = JSON.parse(await file.text());
  if (parsed?.version !== 1 || !parsed?.doc) throw new Error('That is not a Kanvara project file.');

  const bitmaps: Record<string, HTMLCanvasElement> = {};
  for (const [id, url] of Object.entries(parsed.bitmaps ?? {})) {
    const img = new Image();
    img.src = url as string;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    bitmaps[id] = c;
  }

  return { doc: parsed.doc as CanvasDoc, bitmaps };
}
