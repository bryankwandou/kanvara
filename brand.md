# Kanvara — Brand

## Name

**Kanvara.** Rooted in *canvas*, extended with a soft open ending so it reads as a place rather than a tool — the way *Figma* or *Vercel* do. Two syllables of consonant, one of vowel release. Pronounces identically in Indonesian and English, which matters because the first users are Indonesian and the market is not.

Verified free across all three channels before it was locked: `kanvara.vercel.app`, `github.com/kanvara`, and the `kanvara` npm name. No conflicting trademark surfaced.

## What the mark means

A rounded tile split by an S-curve. The upper-left half is inert gray; the lower-right half carries the warm gradient. The dividing line is not decoration — it is the **tone curve**, the single control that defines photo editing, and it is doing visibly to the tile what the product does to a photograph.

Read at 16px it is a distinctive two-tone shape. Read at 200px it is a before/after. That dual reading is the point.

Never place the mark on a photograph without a solid tile behind it. Never recolor the gray half — the contrast between dead and alive is the whole idea.

## Color

The canvas is where the user's photograph lives, so the interface around it is held at true neutral. Any color cast in the chrome would make them misjudge white balance in their own image. This is a functional constraint, not a stylistic one.

| Token | Value | Use |
| --- | --- | --- |
| `--surface-0` | `#0B0B0D` | App background, behind the canvas |
| `--surface-1` | `#141417` | Panels, rails |
| `--surface-2` | `#1C1C21` | Raised controls, inputs |
| `--surface-3` | `#26262D` | Hover, active track |
| `--line` | `#2E2E36` | Hairline dividers |
| `--text-hi` | `#F2F2F4` | Primary text |
| `--text-mid` | `#9E9EA8` | Labels, secondary |
| `--text-low` | `#63636E` | Disabled, hints |

Two accents, and each one carries meaning rather than mood:

| Token | Value | Meaning |
| --- | --- | --- |
| `--craft` | `#FF9E2C` | Anything the user does by hand — sliders, tools, selections |
| `--craft-soft` | `#FFC46B` | Craft accent on dark hover states |
| `--assist` | `#7C5CFF` | Anything computed for them — background removal, auto-enhance |
| `--danger` | `#FF5C5C` | Destructive only: delete layer, discard project |

Amber for the hand, violet for the machine. A user learns this in about ninety seconds and never has to read a tooltip to know whether a button is going to think or just act. It also avoids the three colors this category has already spent: Adobe blue, Picsart magenta, Canva teal.

## Type

**Inter** for everything in the interface, tracked to `-0.011em` at display sizes so headlines hold together.

**JetBrains Mono** for every number the user can change — slider readouts, canvas dimensions, export size, hex values, zoom percentage. Proportional digits jitter as they count, and in a tool where a user drags a slider and watches a value, that jitter is the difference between feeling precise and feeling cheap.

## Voice

Plain, specific, and short. The product's actual claim is unusual enough that it needs no amplification: a complete editor, no watermark, no account, nothing uploaded. State it and stop.

Write "Remove background", not "✨ AI Magic Background Remover". Say what a control does, name it after what it changes. No exclamation marks. No emoji anywhere in the product surface. If a sentence would survive being read aloud to a professional retoucher without embarrassment, it ships.

Never describe the product as free *as though it were a concession*. It is free because it runs on the user's own machine and costs nothing to serve. That is a fact about the architecture, and it is the most persuasive thing there is to say.
