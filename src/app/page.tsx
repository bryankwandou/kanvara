import Link from 'next/link';
import { CurveHero } from '@/components/landing/CurveHero';
import { LiveDemo } from '@/components/landing/LiveDemo';
import { Reveal } from '@/components/landing/Reveal';
import { PRESETS } from '@/engine/presets';
import { ANIMATIONS, BLEND_MODES } from '@/engine/types';

const CAPABILITIES = [
  {
    title: 'Twenty tone and colour controls',
    body: 'Exposure, contrast, highlights, shadows, whites, blacks, temperature, tint, vibrance, saturation, hue, clarity and the rest. Every one runs as a GPU shader, so a 24-megapixel file responds while the slider is still moving.',
  },
  {
    title: `${PRESETS.length - 1} colour grades`,
    body: 'Film stocks, cinema grades, street and portrait looks. Each one is built out of the same sliders you already have, with a strength control, and you can keep editing after applying it.',
  },
  {
    title: 'Background removal on your machine',
    body: 'A segmentation model runs in the tab. The first run fetches the weights; after that it works with the network switched off. There is also a colour keyer for flat studio backdrops.',
  },
  {
    title: 'Real perspective, not a shear',
    body: 'Tilt slices the layer and scales each slice by its own depth, which produces an actual vanishing point. The far edge gets smaller the way it does in the world.',
  },
  {
    title: `${BLEND_MODES.length} blend modes and full layers`,
    body: 'Stack images, text, vector shapes and paint. Reorder, lock, hide, duplicate, set opacity and blending per layer. Sixty steps of undo across all of it.',
  },
  {
    title: `${ANIMATIONS.length - 1} motion presets with video output`,
    body: 'Give any layer movement with its own delay, duration and intensity, scrub the timeline, then write the whole composition out as WebM at up to 60 frames a second.',
  },
];

const FACTS = [
  { k: 'Watermarks', v: 'None' },
  { k: 'Account required', v: 'No' },
  { k: 'Photos uploaded', v: 'Zero' },
  { k: 'Export ceiling', v: 'Unlimited' },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-surface-0/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark.svg" alt="" className="size-8" />
            <span className="text-[15px] font-semibold tracking-[-0.025em]">Kanvara</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] text-text-mid md:flex">
            <a href="#demo" className="transition-colors hover:text-text-hi">Demo</a>
            <a href="#capabilities" className="transition-colors hover:text-text-hi">What it does</a>
            <a href="#privacy" className="transition-colors hover:text-text-hi">Where it runs</a>
          </nav>

          <Link
            href="/edit"
            className="rounded-md bg-craft px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-craft-soft"
          >
            Open the editor
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-line">
          {/* A single soft light source behind the fold, positioned off-centre
              so the layout does not read as symmetrical. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-[58%] size-[820px] -translate-x-1/2 rounded-full opacity-[0.18] blur-[120px]"
            style={{ background: 'radial-gradient(circle, #ff9e2c 0%, #7c5cff 45%, transparent 70%)' }}
          />

          <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 px-5 py-20 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
            <Reveal>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface-1 px-3 py-1.5 text-[12px] text-text-mid">
                <span className="size-1.5 rounded-full bg-craft" />
                Runs entirely in the browser
              </p>

              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[54px] lg:text-[62px]">
                A complete photo editor
                <br />
                <span className="text-text-mid">that keeps your work.</span>
              </h1>

              <p className="mt-6 max-w-[54ch] text-[16px] leading-relaxed text-text-mid">
                Layers, curves, film grades, background removal, type, perspective and motion
                export. No watermark on the way out, no account on the way in, and the photo never
                leaves the machine it was opened on.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/edit"
                  className="rounded-lg bg-craft px-6 py-3 text-[14px] font-medium text-black transition-all duration-150 hover:bg-craft-soft active:scale-[0.98]"
                >
                  Open the editor
                </Link>
                <a
                  href="#demo"
                  className="rounded-lg border border-line bg-surface-1 px-6 py-3 text-[14px] font-medium text-text-hi transition-colors hover:bg-surface-2"
                >
                  Try it on your own photo
                </a>
              </div>

              <dl className="mt-12 grid max-w-[520px] grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                {FACTS.map((f) => (
                  <div key={f.k}>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-low">{f.k}</dt>
                    <dd className="mt-1 text-[15px] font-medium text-text-hi">{f.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={140} className="flex justify-center lg:justify-end">
              <CurveHero />
            </Reveal>
          </div>
        </section>

        <section id="demo" className="border-b border-line px-5 py-20 md:py-24">
          <div className="mx-auto max-w-[1180px]">
            <Reveal>
              <div className="mb-10 max-w-[62ch]">
                <h2 className="text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">
                  Load a photo and judge it yourself
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-text-mid">
                  This panel calls the same WebGL renderer the editor ships with. Drop something in
                  and watch the grades apply. Nothing is uploaded, and closing the tab discards it.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <LiveDemo />
            </Reveal>
          </div>
        </section>

        <section id="capabilities" className="border-b border-line px-5 py-20 md:py-24">
          <div className="mx-auto max-w-[1180px]">
            <Reveal>
              <div className="mb-12 max-w-[62ch]">
                <h2 className="text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">
                  What is actually in here
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-text-mid">
                  Written from scratch rather than assembled from a filter library, which is why
                  the sliders behave like a raw processor instead of a CSS filter chain.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((c, i) => (
                <Reveal key={c.title} delay={i * 60}>
                  <article className="group h-full bg-surface-1 p-7 transition-colors duration-200 hover:bg-surface-2">
                    <span className="tabular block text-[11px] text-text-low">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-3 text-[16px] font-medium leading-snug tracking-[-0.015em] text-text-hi">
                      {c.title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-mid">{c.body}</p>
                    <span className="mt-5 block h-px w-10 bg-line transition-all duration-300 group-hover:w-20 group-hover:bg-craft" />
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="border-b border-line px-5 py-20 md:py-24">
          <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <h2 className="text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">
                Free because of where it runs
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-text-mid">
                <p>
                  Editors that charge for an export are paying for the machines that did the
                  rendering. Kanvara does the rendering on the graphics card already sitting in
                  front of you, so serving it costs about as much as serving a static page.
                </p>
                <p>
                  That is the whole reason there is no watermark, no export cap and no sign-up
                  wall. It is a property of the architecture, not a promotion that expires.
                </p>
                <p>
                  Your files are read with the browser&apos;s own decoder and held in memory for as
                  long as the tab is open. There is no upload endpoint in this codebase to send
                  them to.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-panel border border-line bg-surface-1 p-7">
                <h3 className="text-[13px] font-medium uppercase tracking-[0.08em] text-text-low">
                  How the pipeline is put together
                </h3>
                <ol className="mt-5 space-y-5">
                  {[
                    ['Decode', 'The browser turns your file into a bitmap. It stays in this tab.'],
                    ['Upload to GPU', 'The bitmap becomes a texture once, not once per slider move.'],
                    ['Shade', 'Blur runs separably, then twenty adjustments land in a single pass.'],
                    ['Compose', 'Layers are stacked with blend modes and per-layer perspective.'],
                    ['Write out', 'PNG, JPEG, WebP or WebM, at whatever size you ask for.'],
                  ].map(([step, detail], i) => (
                    <li key={step} className="flex gap-4">
                      <span className="tabular mt-0.5 shrink-0 text-[11px] text-craft">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-text-hi">{step}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-text-mid">{detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24">
          <Reveal>
            <div className="mx-auto max-w-[640px] text-center">
              <h2 className="text-[32px] font-semibold tracking-[-0.03em] sm:text-[40px]">
                Open it and start editing
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text-mid">
                There is no onboarding, no trial and nothing to install. An Android build is in
                progress and will read the same project files.
              </p>
              <Link
                href="/edit"
                className="mt-8 inline-block rounded-lg bg-craft px-7 py-3.5 text-[14px] font-medium text-black transition-all duration-150 hover:bg-craft-soft active:scale-[0.98]"
              >
                Open the editor
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 text-[12.5px] text-text-low">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark.svg" alt="" className="size-6 opacity-70" />
            <span>Kanvara</span>
          </div>
          <p className="max-w-[52ch]">
            Built independently. Not affiliated with, endorsed by, or derived from any other
            editing product.
          </p>
          <a
            href="https://github.com/bryankwandou/kanvara"
            className="transition-colors hover:text-text-mid"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
