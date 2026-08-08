'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  IDENTITY_TRANSFORM,
  NEUTRAL,
  STATIC_ANIM,
  uid,
  type CanvasDoc,
  type DrawLayer,
  type ImageLayer,
  type Layer,
  type ShapeLayer,
  type TextLayer,
} from './types';

export type ToolId =
  | 'select'
  | 'crop'
  | 'adjust'
  | 'filters'
  | 'effects'
  | 'text'
  | 'draw'
  | 'shapes'
  | 'cutout'
  | 'layers'
  | 'animate'
  | 'export';

/**
 * Bitmaps live outside the document because the document is snapshotted on
 * every edit for undo. Cloning an ImageBitmap per keystroke would be both
 * slow and a memory leak; keying them by layer id keeps snapshots to plain
 * JSON while the pixels stay in one place.
 */
const bitmaps = new Map<string, CanvasImageSource & { width: number; height: number }>();

export function putBitmap(id: string, bmp: HTMLCanvasElement | ImageBitmap) {
  bitmaps.set(id, bmp as never);
}
export function getBitmap(id: string) {
  return bitmaps.get(id);
}
export function dropBitmap(id: string) {
  bitmaps.delete(id);
}

export type BrushSettings = {
  mode: 'paint' | 'erase' | 'smudge';
  size: number;
  hardness: number; // 0..100
  opacity: number; // 0..1
  color: string;
};

export type CropRect = { x: number; y: number; w: number; h: number } | null;

type State = {
  doc: CanvasDoc;
  tool: ToolId;
  zoom: number; // 1 = fit
  past: CanvasDoc[];
  future: CanvasDoc[];
  busy: string | null; // human-readable label while a long task runs
  brush: BrushSettings;
  crop: CropRect;
  /** Non-null while the motion timeline is being previewed. */
  playhead: number | null;
};

const EMPTY_DOC: CanvasDoc = {
  width: 1200,
  height: 1200,
  background: '#ffffff',
  layers: [],
  selectedId: null,
};

let state: State = {
  doc: EMPTY_DOC,
  tool: 'adjust',
  zoom: 1,
  past: [],
  future: [],
  busy: null,
  brush: { mode: 'paint', size: 48, hardness: 70, opacity: 1, color: '#ff9e2c' },
  crop: null,
  playhead: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

/**
 * Mutating the document always goes through here. `commit: false` is for the
 * continuous part of a gesture — dragging a slider or a layer — so that one
 * drag lands as one undo step instead of two hundred.
 */
export function edit(fn: (doc: CanvasDoc) => CanvasDoc, commit = true) {
  const next = fn(state.doc);
  if (next === state.doc) return;
  if (commit) {
    set({
      doc: next,
      past: [...state.past, state.doc].slice(-60),
      future: [],
    });
  } else {
    set({ doc: next });
  }
}

/** Call once at the start of a drag so the pre-drag state becomes the undo point. */
export function beginGesture() {
  set({ past: [...state.past, state.doc].slice(-60), future: [] });
}

export function undo() {
  if (!state.past.length) return;
  const prev = state.past[state.past.length - 1];
  set({
    doc: prev,
    past: state.past.slice(0, -1),
    future: [state.doc, ...state.future].slice(0, 60),
  });
}

export function redo() {
  if (!state.future.length) return;
  set({
    doc: state.future[0],
    past: [...state.past, state.doc].slice(-60),
    future: state.future.slice(1),
  });
}

export const setTool = (tool: ToolId) => set({ tool, crop: tool === 'crop' ? state.crop : null });
export const setBrush = (patch: Partial<BrushSettings>) => set({ brush: { ...state.brush, ...patch } });
export const setCrop = (crop: CropRect) => set({ crop });
export const setPlayhead = (playhead: number | null) => set({ playhead });
export const setZoom = (zoom: number) => set({ zoom: Math.min(8, Math.max(0.05, zoom)) });
export const setBusy = (busy: string | null) => set({ busy });

export function selectLayer(id: string | null) {
  edit((d) => ({ ...d, selectedId: id }), false);
}

export function updateLayer<T extends Layer>(id: string, patch: Partial<T>, commit = true) {
  edit(
    (d) => ({
      ...d,
      layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
    }),
    commit,
  );
}

export function removeLayer(id: string) {
  dropBitmap(id);
  edit((d) => {
    const layers = d.layers.filter((l) => l.id !== id);
    return { ...d, layers, selectedId: layers[layers.length - 1]?.id ?? null };
  });
}

export function reorderLayer(id: string, delta: number) {
  edit((d) => {
    const i = d.layers.findIndex((l) => l.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= d.layers.length) return d;
    const layers = [...d.layers];
    [layers[i], layers[j]] = [layers[j], layers[i]];
    return { ...d, layers };
  });
}

export function duplicateLayer(id: string) {
  const src = state.doc.layers.find((l) => l.id === id);
  if (!src) return;
  const copy: Layer = { ...src, id: uid(), name: `${src.name} copy` };

  const bmp = bitmaps.get(id);
  if (bmp) {
    // Draw into a fresh canvas rather than aliasing the original, otherwise
    // painting on the duplicate would also alter the layer it came from.
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext('2d')!.drawImage(bmp as CanvasImageSource, 0, 0);
    bitmaps.set(copy.id, c);
  }

  edit((d) => {
    const i = d.layers.findIndex((l) => l.id === id);
    const layers = [...d.layers];
    layers.splice(i + 1, 0, copy);
    return { ...d, layers, selectedId: copy.id };
  });
}

function baseLayer(name: string) {
  return {
    id: uid(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blend: 'normal' as const,
    transform: { ...IDENTITY_TRANSFORM },
    anim: { ...STATIC_ANIM },
  };
}

export function addImageLayer(bmp: HTMLCanvasElement | ImageBitmap, name = 'Image') {
  const layer: ImageLayer = {
    ...baseLayer(name),
    kind: 'image',
    width: bmp.width,
    height: bmp.height,
    adjustments: { ...NEUTRAL },
    presetId: null,
  };
  putBitmap(layer.id, bmp);
  edit((d) => ({ ...d, layers: [...d.layers, layer], selectedId: layer.id }));
  return layer;
}

export function addTextLayer(text = 'Double-click to edit') {
  const layer: TextLayer = {
    ...baseLayer('Text'),
    kind: 'text',
    text,
    fontFamily: 'Inter',
    fontSize: Math.round(state.doc.width / 12),
    fontWeight: 700,
    italic: false,
    letterSpacing: 0,
    lineHeight: 1.15,
    align: 'center',
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 0,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    curve: 0,
  };
  edit((d) => ({ ...d, layers: [...d.layers, layer], selectedId: layer.id }));
  return layer;
}

export function addShapeLayer(shape: ShapeLayer['shape']) {
  const size = Math.round(Math.min(state.doc.width, state.doc.height) * 0.4);
  const layer: ShapeLayer = {
    ...baseLayer(shape[0].toUpperCase() + shape.slice(1)),
    kind: 'shape',
    shape,
    width: size,
    height: size,
    fill: '#ff9e2c',
    stroke: '#00000000',
    strokeWidth: 0,
    cornerRadius: shape === 'rect' ? 24 : 0,
  };
  edit((d) => ({ ...d, layers: [...d.layers, layer], selectedId: layer.id }));
  return layer;
}

export function addDrawLayer() {
  const layer: DrawLayer = {
    ...baseLayer('Paint'),
    kind: 'draw',
    width: state.doc.width,
    height: state.doc.height,
  };
  const c = document.createElement('canvas');
  c.width = layer.width;
  c.height = layer.height;
  putBitmap(layer.id, c);
  edit((d) => ({ ...d, layers: [...d.layers, layer], selectedId: layer.id }));
  return layer;
}

export function newDocument(width: number, height: number, background: string | null) {
  for (const l of state.doc.layers) dropBitmap(l.id);
  set({
    doc: { width, height, background, layers: [], selectedId: null },
    past: [],
    future: [],
  });
}

export function resizeDocument(width: number, height: number) {
  edit((d) => ({ ...d, width, height }));
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const getSnapshot = () => state;

export function useEditor<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    useCallback(() => selector(getSnapshot()), [selector]),
    useCallback(() => selector(getSnapshot()), [selector]),
  );
}

export function useDoc() {
  return useEditor((s) => s.doc);
}

export function useSelected(): Layer | null {
  return useEditor((s) => s.doc.layers.find((l) => l.id === s.doc.selectedId) ?? null);
}

export function readState() {
  return state;
}
