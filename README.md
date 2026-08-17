<p align="center">
  <img src="public/mark.svg" width="72" alt="Kanvara" />
</p>

<h1 align="center">Kanvara</h1>

<p align="center">A complete photo editor that runs entirely in your browser.<br/>No watermark, no account, and the photo never leaves your machine.</p>

---

## What this is

A photo editor built from the shader up. Twenty tone and colour controls, thirty-seven colour
grades, layers with sixteen blend modes, text with arc and outline, vector shapes, a paint layer,
background removal that runs locally, real perspective tilt, and a motion timeline that writes out
video.

It is not a wrapper around CSS filters and it is not a clone of anyone's interface. The colour
pipeline is a WebGL2 fragment shader written for this project, ordered the way a raw processor
orders one: exposure and white balance before tone shaping, tone shaping before saturation, and
the film-like effects last.

## Why it is free

Every pixel is processed on the graphics card in front of you. There is no render farm to pay for,
so there is nothing to recover with a watermark or an export cap. That is a property of where the
code runs rather than a promotion.

There is no upload endpoint anywhere in this repository. Files are decoded by the browser and held
in memory until the tab closes.

## Running it

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. The editor lives at `/edit`.

Requires a browser with WebGL2, which covers Chrome, Edge, Firefox and Safari 15 and later.

## Layout

| Path | What lives there |
| --- | --- |
| `src/engine/shaders.ts` | The blur and colour fragment shaders |
| `src/engine/renderer.ts` | WebGL2 context, texture upload, multi-pass render |
| `src/engine/compositor.ts` | Layer stacking, blend modes, text and shape drawing |
| `src/engine/perspective.ts` | Strip-based projective tilt |
| `src/engine/presets.ts` | The colour grades, stored as sparse overrides |
| `src/engine/animate.ts` | Timeline evaluation and WebM encoding |
| `src/engine/cutout.ts` | Background removal, local model and colour keyer |
| `src/engine/store.ts` | Document model, layers, undo history |
| `src/engine/persist.ts` | IndexedDB session guard and the project file format |
| `public/sw.js` | Cache-first service worker behind offline use |
| `src/components/editor/` | Tool rail, canvas stage, and the eleven panels |
| `brand.md` | Colour, type and voice decisions, with the reasoning |

## Notable implementation details

**One WebGL context for the session.** Browsers cap contexts at roughly sixteen. Creating one per
render would exhaust that within a few dozen edits, so the source texture is uploaded once and
every subsequent slider move is pure GPU work.

**Blur is separable.** Two nine-tap passes cost eighteen samples instead of the eighty-one a 2D
kernel would need, for an identical result.

**Perspective is projective, not affine.** Canvas 2D transforms cannot produce a vanishing point.
The layer is sliced into 128 strips and each is scaled by its own depth, then drawn back to front.

**Downscaling halves repeatedly.** A single `drawImage` past roughly 2× aliases on fine detail.
Stepping down in halves removes the shimmer on hair and text.

**Gestures are one undo step.** Continuous edits write without committing history; the pre-drag
state is pushed once when the gesture starts.

**The session survives a closed tab.** Layers are written to IndexedDB as PNG blobs once editing
goes idle for a couple of seconds. `localStorage` was never an option — one twelve-megapixel layer
base64-encoded already exceeds the five-megabyte budget.

**The histogram is read from a 220px composite.** Pulling pixels back off the GPU is the expensive
half of the operation, and at that size the shape is indistinguishable from a full-resolution read
while costing under a millisecond.

**Offline is real, not a claim.** A cache-first service worker pins the shell and its chunks on
first visit. After that the editor opens with the network switched off, which is the only honest
way to promise offline work when nothing is uploaded anyway.

## Keyboard

| Key | Action |
| --- | --- |
| `A` `F` `C` `T` `R` `X` `B` `S` `M` `L` `E` | Switch tool |
| `Ctrl`/`⌘` `Z` | Undo |
| `Ctrl`/`⌘` `Shift` `Z` | Redo |
| `Ctrl`/`⌘` `O` | Open a photo |
| `Ctrl`/`⌘` `D` | Duplicate layer |
| `Delete` | Remove layer |
| `Ctrl`/`⌘` scroll | Zoom |
| `Alt` drag | Pan |
| `Shift` while dragging a slider | Fine adjustment |
| `\` held | Show the untouched original |
| `0` | Fit the photo to the window |
| `?` | Open the shortcut sheet |

## Optional configuration

Background removal runs locally by default. To route it to a hosted service instead, set:

```
NEXT_PUBLIC_CUTOUT_ENDPOINT=https://your-service/remove
```

It should accept a multipart POST with an `image` field and return a PNG with alpha. If the
request fails the app falls back to the local model rather than leaving you with nothing.

## Status

The browser editor is the product. An Android build is in progress and will read the same project
structure.

## Licence

MIT.

Kanvara is an independent project. It is not affiliated with, endorsed by, or derived from any
other editing product.
