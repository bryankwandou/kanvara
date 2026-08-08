'use client';

import { useEffect, useRef, useState } from 'react';
import { IconPause, IconPlay } from '@/components/ui/Icons';
import { Slider } from '@/components/ui/Slider';
import { encodeVideo, supportsVideoExport, timelineLength } from '@/engine/animate';
import { download, humanBytes } from '@/engine/export';
import { beginGesture, setPlayhead, updateLayer, useDoc, useEditor, useSelected } from '@/engine/store';
import { ANIMATIONS, type AnimationKind, type LayerAnimation } from '@/engine/types';
import { Button, EmptyState, Field, inputClass, PanelHeader, Section } from './Shell';

export function MotionPanel() {
  const doc = useDoc();
  const layer = useSelected();
  const playhead = useEditor((s) => s.playhead);

  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(30);
  const [outWidth, setOutWidth] = useState(1080);
  const [encoding, setEncoding] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const raf = useRef(0);
  const t0 = useRef(0);

  const length = timelineLength(doc);

  // The preview is driven off wall-clock time rather than a frame counter, so
  // a heavy composite shows up as a dropped frame instead of slow motion.
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(raf.current);
      return;
    }
    t0.current = performance.now() - (playhead ?? 0) * 1000;
    const tick = () => {
      const t = ((performance.now() - t0.current) / 1000) % length;
      setPlayhead(t);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => setPlayhead(null), []);

  const anim = layer?.anim;
  const setAnim = (patch: Partial<LayerAnimation>, commit = true) => {
    if (!layer || !anim) return;
    updateLayer(layer.id, { anim: { ...anim, ...patch } }, commit);
  };

  const exportVideo = async () => {
    setResult(null);
    setEncoding(0);
    setPlaying(false);
    setPlayhead(null);
    try {
      const blob = await encodeVideo(doc, {
        fps,
        seconds: length,
        width: outWidth,
        onProgress: setEncoding,
      });
      download(blob, `kanvara-motion.webm`);
      setResult(`Saved ${humanBytes(blob.size)} of WebM.`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Encoding failed.');
    } finally {
      setEncoding(null);
    }
  };

  const animated = doc.layers.filter((l) => l.anim && l.anim.kind !== 'none').length;

  return (
    <>
      <PanelHeader
        title="Motion"
        hint="Give any layer movement, then write the whole thing out as video."
        action={
          <Button
            variant={playing ? 'ghost' : 'solid'}
            onClick={() => {
              if (playing) {
                setPlaying(false);
                setPlayhead(null);
              } else {
                setPlaying(true);
              }
            }}
            disabled={animated === 0}
          >
            {playing ? <IconPause className="size-[13px]" /> : <IconPlay className="size-[13px]" />}
            {playing ? 'Stop' : 'Play'}
          </Button>
        }
      />

      <div className="rail-scroll flex-1 overflow-y-auto pb-8">
        {playhead !== null && (
          <div className="border-b border-line/60 px-4 py-2">
            <div className="mb-1.5 flex justify-between text-[11px] text-text-low">
              <span>Timeline</span>
              <span className="tabular text-craft">{playhead.toFixed(2)}s / {length.toFixed(2)}s</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-craft" style={{ width: `${(playhead / length) * 100}%` }} />
            </div>
          </div>
        )}

        {!layer ? (
          <EmptyState text="Select a layer to animate it. Each layer carries its own motion, delay and duration." />
        ) : (
          <>
            <Section title={`Motion for "${layer.name}"`}>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {ANIMATIONS.map((a) => {
                  const active = anim?.kind === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      title={a.hint}
                      onClick={() => setAnim({ kind: a.id as AnimationKind })}
                      className={`rounded-md border px-2.5 py-2 text-left transition-all duration-150 active:scale-[0.98] ${
                        active
                          ? 'border-craft bg-craft/10'
                          : 'border-line bg-surface-2 hover:border-text-low'
                      }`}
                    >
                      <span className={`block text-[12px] ${active ? 'text-craft' : 'text-text-hi'}`}>
                        {a.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-tight text-text-low">{a.hint}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {anim && anim.kind !== 'none' && (
              <Section title="Timing">
                <Slider label="Delay" value={anim.delay * 10} min={0} max={80} unit=""
                  onCommitStart={beginGesture} onChange={(v) => setAnim({ delay: v / 10 }, false)} />
                <Slider label="Duration" value={anim.duration * 10} min={2} max={120} origin={12}
                  onCommitStart={beginGesture} onChange={(v) => setAnim({ duration: v / 10 }, false)} />
                <Slider label="Intensity" value={anim.intensity} min={0} max={100} origin={60} unit="%"
                  onCommitStart={beginGesture} onChange={(v) => setAnim({ intensity: v }, false)} />
                <label className="flex items-center gap-2 pt-1 text-[12px] text-text-mid">
                  <input
                    type="checkbox"
                    checked={anim.loop}
                    onChange={(e) => setAnim({ loop: e.target.checked })}
                    className="accent-craft"
                  />
                  Repeat for the whole clip
                </label>
              </Section>
            )}
          </>
        )}

        <Section title="Export video">
          {!supportsVideoExport() ? (
            <p className="text-[11px] leading-relaxed text-text-low">
              This browser cannot encode video. Chrome, Edge and Firefox can.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Frame rate">
                  <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className={inputClass}>
                    <option value={24}>24 fps</option>
                    <option value={30}>30 fps</option>
                    <option value={60}>60 fps</option>
                  </select>
                </Field>
                <Field label="Width">
                  <select value={outWidth} onChange={(e) => setOutWidth(Number(e.target.value))} className={inputClass}>
                    <option value={720}>720 px</option>
                    <option value={1080}>1080 px</option>
                    <option value={1440}>1440 px</option>
                    <option value={2160}>2160 px</option>
                  </select>
                </Field>
              </div>

              <p className="mb-2 text-[11px] text-text-low">
                Clip length follows the longest layer: <span className="tabular">{length.toFixed(1)}s</span>
              </p>

              <Button variant="solid" full onClick={exportVideo} disabled={encoding !== null || animated === 0}>
                {encoding === null ? 'Export WebM' : `Encoding ${Math.round(encoding * 100)}%`}
              </Button>

              {encoding !== null && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full bg-craft transition-[width]" style={{ width: `${encoding * 100}%` }} />
                </div>
              )}
              {result && <p className="mt-2 text-[11px] text-text-mid">{result}</p>}
              {animated === 0 && (
                <p className="mt-2 text-[11px] text-text-low">Nothing is animated yet.</p>
              )}
            </>
          )}
        </Section>
      </div>
    </>
  );
}
