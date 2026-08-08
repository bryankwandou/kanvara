/**
 * Every adjustment is stored as a plain number in a flat record, and the
 * renderer reads it straight into a uniform. Keeping the shape flat is what
 * makes history, presets, copy/paste of edits, and serialisation to a saved
 * project all fall out for free — none of them need to know what a field means.
 */
export type Adjustments = {
  exposure: number; // -100..100, stops * 25
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  vibrance: number; // -100..100
  temperature: number; // -100 (cool) .. 100 (warm)
  tint: number; // -100 (green) .. 100 (magenta)
  highlights: number; // -100..100
  shadows: number; // -100..100
  whites: number; // -100..100
  blacks: number; // -100..100
  hue: number; // -180..180 degrees
  sharpen: number; // 0..100
  blur: number; // 0..100
  grain: number; // 0..100
  vignette: number; // -100 (bright) .. 100 (dark)
  fade: number; // 0..100, lifts the black point
  grayscale: number; // 0..100
  sepia: number; // 0..100
  invert: number; // 0..100
};

export const NEUTRAL: Adjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  hue: 0,
  sharpen: 0,
  blur: 0,
  grain: 0,
  vignette: 0,
  fade: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

export const ADJUSTMENT_GROUPS: {
  label: string;
  keys: { key: keyof Adjustments; label: string; min: number; max: number }[];
}[] = [
  {
    label: 'Light',
    keys: [
      { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
      { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
      { key: 'whites', label: 'Whites', min: -100, max: 100 },
      { key: 'blacks', label: 'Blacks', min: -100, max: 100 },
      { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
    ],
  },
  {
    label: 'Color',
    keys: [
      { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
      { key: 'tint', label: 'Tint', min: -100, max: 100 },
      { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { key: 'hue', label: 'Hue shift', min: -180, max: 180 },
    ],
  },
  {
    label: 'Detail',
    keys: [
      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
      { key: 'blur', label: 'Blur', min: 0, max: 100 },
      { key: 'grain', label: 'Grain', min: 0, max: 100 },
    ],
  },
  {
    label: 'Effects',
    keys: [
      { key: 'vignette', label: 'Vignette', min: -100, max: 100 },
      { key: 'fade', label: 'Fade', min: 0, max: 100 },
      { key: 'grayscale', label: 'Black & white', min: 0, max: 100 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'invert', label: 'Invert', min: 0, max: 100 },
    ],
  },
];

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export const BLEND_MODES: BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

/** Position/scale/rotation shared by every layer type. */
export type Transform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
  /** Perspective tilt, in degrees, applied before the 2D transform. */
  tiltX: number;
  tiltY: number;
};

export const IDENTITY_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  tiltX: 0,
  tiltY: 0,
};

type LayerBase = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1
  blend: BlendMode;
  transform: Transform;
  /** Lives on the layer so undo covers motion the same way it covers colour. */
  anim: LayerAnimation;
};

export type LayerAnimation = {
  kind: AnimationKind;
  /** Seconds before this layer starts moving. */
  delay: number;
  /** Seconds the motion takes; it then holds or loops for the rest. */
  duration: number;
  loop: boolean;
  intensity: number; // 0..100
};

export const STATIC_ANIM: LayerAnimation = {
  kind: 'none',
  delay: 0,
  duration: 1.2,
  loop: true,
  intensity: 60,
};

export type ImageLayer = LayerBase & {
  kind: 'image';
  /** Natural pixel dimensions of the source bitmap. */
  width: number;
  height: number;
  adjustments: Adjustments;
  /** Set once a filter preset is applied, purely so the UI can show which. */
  presetId: string | null;
};

export type TextLayer = LayerBase & {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  letterSpacing: number;
  lineHeight: number;
  align: 'left' | 'center' | 'right';
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  curve: number; // -100..100, bends the baseline into an arc
};

export type ShapeLayer = LayerBase & {
  kind: 'shape';
  shape: 'rect' | 'ellipse' | 'triangle' | 'star' | 'heart' | 'line';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
};

export type DrawLayer = LayerBase & {
  kind: 'draw';
  width: number;
  height: number;
};

export type Layer = ImageLayer | TextLayer | ShapeLayer | DrawLayer;

export type CanvasDoc = {
  width: number;
  height: number;
  background: string | null; // null = transparent
  layers: Layer[];
  selectedId: string | null;
};

export type AnimationKind =
  | 'none'
  | 'fade'
  | 'zoom'
  | 'pan'
  | 'kenburns'
  | 'spin'
  | 'pulse'
  | 'shake'
  | 'flicker'
  | 'glitch'
  | 'sweep';

export const ANIMATIONS: { id: AnimationKind; label: string; hint: string }[] = [
  { id: 'none', label: 'Static', hint: 'No motion' },
  { id: 'fade', label: 'Fade in', hint: 'Opacity 0 to 1' },
  { id: 'zoom', label: 'Zoom', hint: 'Scales toward the viewer' },
  { id: 'pan', label: 'Pan', hint: 'Slides across frame' },
  { id: 'kenburns', label: 'Ken Burns', hint: 'Slow zoom with drift' },
  { id: 'spin', label: 'Spin', hint: 'Full rotation' },
  { id: 'pulse', label: 'Pulse', hint: 'Rhythmic scale' },
  { id: 'shake', label: 'Shake', hint: 'Fast positional jitter' },
  { id: 'flicker', label: 'Flicker', hint: 'Irregular opacity' },
  { id: 'glitch', label: 'Glitch', hint: 'Channel offset tearing' },
  { id: 'sweep', label: 'Light sweep', hint: 'Specular band travels across' },
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
