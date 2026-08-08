import { NEUTRAL, type Adjustments } from './types';

export type Preset = {
  id: string;
  name: string;
  group: string;
  /** Only the fields the look actually changes; the rest stay neutral. */
  values: Partial<Adjustments>;
};

/**
 * Presets are stored as sparse overrides rather than full adjustment sets so
 * that applying one never silently wipes an unrelated slider the user already
 * moved, and so the strength control can interpolate cleanly from neutral.
 */
export const PRESETS: Preset[] = [
  { id: 'original', name: 'Original', group: 'Basic', values: {} },

  { id: 'crisp', name: 'Crisp', group: 'Basic', values: { contrast: 18, sharpen: 30, vibrance: 12 } },
  { id: 'soft', name: 'Soft', group: 'Basic', values: { contrast: -14, fade: 18, blur: 4, shadows: 12 } },
  { id: 'punch', name: 'Punch', group: 'Basic', values: { contrast: 32, saturation: 22, blacks: -18, sharpen: 22 } },
  { id: 'clean', name: 'Clean', group: 'Basic', values: { exposure: 8, highlights: -12, whites: 10, vibrance: 8 } },
  { id: 'matte', name: 'Matte', group: 'Basic', values: { fade: 34, contrast: -8, blacks: 14, saturation: -10 } },

  { id: 'portra', name: 'Portra', group: 'Film', values: { temperature: 14, vibrance: 10, saturation: -6, highlights: -14, shadows: 10, fade: 12, grain: 14 } },
  { id: 'gold200', name: 'Gold 200', group: 'Film', values: { temperature: 26, contrast: 10, vibrance: 16, blacks: 8, grain: 18 } },
  { id: 'ektar', name: 'Ektar', group: 'Film', values: { saturation: 26, contrast: 20, temperature: 6, sharpen: 18, grain: 8 } },
  { id: 'trix', name: 'Tri-X', group: 'Film', values: { grayscale: 100, contrast: 30, blacks: -14, grain: 32, sharpen: 16 } },
  { id: 'hp5', name: 'HP5', group: 'Film', values: { grayscale: 100, contrast: 14, fade: 16, grain: 26, shadows: 12 } },
  { id: 'superia', name: 'Superia', group: 'Film', values: { temperature: -10, tint: -8, saturation: 14, contrast: 12, grain: 16 } },
  { id: 'cinestill', name: 'Cinestill', group: 'Film', values: { temperature: 18, highlights: 14, shadows: 16, saturation: 8, grain: 20, vignette: 14 } },
  { id: 'polaroid', name: 'Polaroid', group: 'Film', values: { fade: 40, temperature: 12, contrast: -12, saturation: -8, vignette: 18, grain: 12 } },

  { id: 'teal-orange', name: 'Teal & Orange', group: 'Cinema', values: { temperature: 20, tint: -12, contrast: 22, saturation: 12, shadows: -14, highlights: 10 } },
  { id: 'noir', name: 'Noir', group: 'Cinema', values: { grayscale: 100, contrast: 42, blacks: -26, vignette: 34, sharpen: 20 } },
  { id: 'bleach', name: 'Bleach Bypass', group: 'Cinema', values: { saturation: -46, contrast: 34, whites: 16, sharpen: 24 } },
  { id: 'moonlit', name: 'Moonlit', group: 'Cinema', values: { temperature: -34, tint: 10, exposure: -12, contrast: 16, shadows: 14, vignette: 22 } },
  { id: 'ember', name: 'Ember', group: 'Cinema', values: { temperature: 32, hue: -6, contrast: 18, shadows: -12, vignette: 20, grain: 10 } },
  { id: 'dune', name: 'Dune', group: 'Cinema', values: { temperature: 28, saturation: -18, contrast: 14, fade: 14, highlights: -10 } },
  { id: 'nordic', name: 'Nordic', group: 'Cinema', values: { temperature: -22, saturation: -14, exposure: 6, contrast: 10, whites: 12 } },

  { id: 'vivid-city', name: 'Vivid City', group: 'Street', values: { saturation: 30, contrast: 24, sharpen: 30, blacks: -16, vibrance: 14 } },
  { id: 'concrete', name: 'Concrete', group: 'Street', values: { saturation: -30, contrast: 20, sharpen: 26, temperature: -8 } },
  { id: 'neon', name: 'Neon', group: 'Street', values: { saturation: 40, vibrance: 24, contrast: 26, shadows: -20, hue: 8, vignette: 16 } },
  { id: 'midnight', name: 'Midnight', group: 'Street', values: { exposure: -16, temperature: -18, contrast: 28, blacks: -22, vignette: 26 } },

  { id: 'glow', name: 'Glow', group: 'Portrait', values: { exposure: 8, highlights: 12, shadows: 16, saturation: -6, blur: 3, fade: 10 } },
  { id: 'warmth', name: 'Warmth', group: 'Portrait', values: { temperature: 22, vibrance: 14, shadows: 10, contrast: 8 } },
  { id: 'porcelain', name: 'Porcelain', group: 'Portrait', values: { exposure: 12, whites: 14, saturation: -14, contrast: -8, fade: 12 } },
  { id: 'bronze', name: 'Bronze', group: 'Portrait', values: { temperature: 26, sepia: 24, contrast: 14, vignette: 14 } },

  { id: 'sunlit', name: 'Sunlit', group: 'Nature', values: { temperature: 18, exposure: 10, vibrance: 22, highlights: -12, saturation: 10 } },
  { id: 'forest', name: 'Forest', group: 'Nature', values: { tint: -20, saturation: 18, contrast: 14, shadows: 12, temperature: -6 } },
  { id: 'tide', name: 'Tide', group: 'Nature', values: { temperature: -20, vibrance: 20, contrast: 12, whites: 10 } },
  { id: 'desert', name: 'Desert', group: 'Nature', values: { temperature: 24, saturation: -10, whites: 16, contrast: 10, grain: 8 } },

  { id: 'infrared', name: 'Infrared', group: 'Extreme', values: { hue: 140, saturation: 40, contrast: 24 } },
  { id: 'xray', name: 'X-Ray', group: 'Extreme', values: { invert: 100, grayscale: 100, contrast: 30 } },
  { id: 'acid', name: 'Acid', group: 'Extreme', values: { hue: 78, saturation: 60, contrast: 30, vibrance: 20 } },
  { id: 'solarise', name: 'Solarise', group: 'Extreme', values: { invert: 44, contrast: 34, saturation: 20 } },
  { id: 'duotone', name: 'Duotone', group: 'Extreme', values: { grayscale: 100, sepia: 60, hue: 30, contrast: 26 } },
];

export const PRESET_GROUPS = Array.from(new Set(PRESETS.map((p) => p.group)));

/**
 * Blend a preset toward neutral so the strength slider does something
 * meaningful. At strength 0 the image is untouched; at 1 the preset lands
 * exactly on its authored values.
 */
export function applyPreset(base: Adjustments, preset: Preset, strength = 1): Adjustments {
  const out: Adjustments = { ...base };
  for (const key of Object.keys(NEUTRAL) as (keyof Adjustments)[]) {
    const target = preset.values[key];
    if (target === undefined) continue;
    out[key] = Math.round(NEUTRAL[key] + (target - NEUTRAL[key]) * strength);
  }
  return out;
}
