/**
 * Canvas 2D transforms are affine, which means they can shear and scale but
 * can never produce a true vanishing point. Slicing the source into thin
 * strips and scaling each one by its own depth gives a real projective
 * result, and at 128 strips the seams are below one pixel on a 4K canvas.
 */
const STRIPS = 128;
const FOCAL = 2.2;

function tiltOnce(
  src: CanvasImageSource,
  sw: number,
  sh: number,
  angleDeg: number,
  axis: 'y' | 'x',
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(sw));
  out.height = Math.max(1, Math.round(sh));
  const ctx = out.getContext('2d')!;

  const theta = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Along the tilt axis the image is sliced; across it, it is stretched.
  const along = axis === 'y' ? sw : sh;
  const across = axis === 'y' ? sh : sw;
  const step = along / STRIPS;

  type Slice = { pos: number; depth: number; scale: number; offset: number };
  const slices: Slice[] = [];

  for (let i = 0; i < STRIPS; i++) {
    const t = (i + 0.5) / STRIPS - 0.5; // -0.5 .. 0.5
    const depth = t * sin;
    const scale = 1 / (1 + depth / FOCAL);
    slices.push({ pos: i * step, depth, scale, offset: t * cos * scale });
  }

  // Painter's algorithm: the far edge has to go down first or it will sit on
  // top of the near edge where they overlap at steep angles.
  slices.sort((a, b) => b.depth - a.depth);

  for (const s of slices) {
    const destAcross = across * s.scale;
    const destAlong = step * s.scale * cos + 1; // +1 closes sub-pixel seams
    const centreAlong = along / 2 + s.offset * along;
    const centreAcross = across / 2;

    if (axis === 'y') {
      ctx.drawImage(
        src,
        s.pos, 0, step, sh,
        centreAlong - destAlong / 2, centreAcross - destAcross / 2, destAlong, destAcross,
      );
    } else {
      ctx.drawImage(
        src,
        0, s.pos, sw, step,
        centreAcross - destAcross / 2, centreAlong - destAlong / 2, destAcross, destAlong,
      );
    }
  }

  return out;
}

/** Returns the source untouched when there is no tilt, so the common path stays free. */
export function applyPerspective(
  src: CanvasImageSource,
  w: number,
  h: number,
  tiltX: number,
  tiltY: number,
): CanvasImageSource {
  let current = src;
  if (Math.abs(tiltY) > 0.2) current = tiltOnce(current, w, h, tiltY, 'y');
  if (Math.abs(tiltX) > 0.2) current = tiltOnce(current, w, h, tiltX, 'x');
  return current;
}
