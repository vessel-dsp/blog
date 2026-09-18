"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Four renders of one guitar take, switchable without a gap.
 *
 * Every clip is started at the same instant and kept running; switching moves gain
 * between them rather than restarting anything. A/B comparison of a few dB of treble
 * is worthless if the restart puts you at a different point in the phrase.
 *
 * Levels are deliberately not matched. The 10 k load really is quieter, and hiding
 * that behind normalisation would hide half of what the load does.
 */

const CLIPS = [
  {
    id: "dry",
    label: "Dry",
    note: "the take, straight in",
  },
  {
    id: "cable-1m",
    label: "1 m cable",
    note: "1 M load · resonance at 6.9 kHz",
  },
  {
    id: "cable-6m",
    label: "6 m cable",
    note: "1 M load · resonance down at 3.9 kHz",
  },
  {
    id: "fuzz-load",
    label: "6 m into a fuzz",
    note: "10 k load · −5.2 dB, resonance gone",
  },
  {
    id: "buffered",
    label: "Buffered",
    note: "buffer at the guitar, same 6 m cable after it",
  },
] as const;

type ClipId = (typeof CLIPS)[number]["id"];

export function AudioCompare() {
  const [selected, setSelected] = useState<ClipId>("cable-1m");
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainsRef = useRef<Map<ClipId, GainNode>>(new Map());
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const selectedRef = useRef<ClipId>(selected);

  useEffect(() => {
    selectedRef.current = selected;
    const gains = gainsRef.current;
    const ctx = ctxRef.current;
    if (!ctx || gains.size === 0) return;
    for (const [id, gain] of gains) {
      gain.gain.setTargetAtTime(id === selected ? 1 : 0, ctx.currentTime, 0.004);
    }
  }, [selected]);

  const stop = useCallback(() => {
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    sourcesRef.current = [];
    gainsRef.current.clear();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setProgress(0);
    setState("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(async () => {
    setState("loading");
    try {
      const ctx =
        ctxRef.current ??
        new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const buffers = await Promise.all(
        CLIPS.map(async (clip) => {
          const response = await fetch(`/audio/buffer/${clip.id}.mp3`);
          const bytes = await response.arrayBuffer();
          return [clip.id, await ctx.decodeAudioData(bytes)] as const;
        }),
      );

      const startAt = ctx.currentTime + 0.08;
      durationRef.current = buffers[0]?.[1].duration ?? 0;
      startedAtRef.current = startAt;

      for (const [id, buffer] of buffers) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = id === selectedRef.current ? 1 : 0;
        source.connect(gain).connect(ctx.destination);
        source.start(startAt);
        sourcesRef.current.push(source);
        gainsRef.current.set(id, gain);
      }

      setState("playing");

      const tick = () => {
        const elapsed = ctx.currentTime - startedAtRef.current;
        const duration = durationRef.current || 1;
        setProgress(elapsed <= 0 ? 0 : (elapsed % duration) / duration);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setState("error");
    }
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={state === "playing" ? stop : play}
          disabled={state === "loading"}
        >
          {state === "playing"
            ? "Stop"
            : state === "loading"
              ? "Loading…"
              : "Play"}
        </button>
        <div className="h-[2px] flex-1 bg-base-300" aria-hidden="true">
          <div
            className="h-full bg-base-content"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {state === "error" ? (
        <p className="mt-3 text-[11px] text-error">
          Audio could not start. The clips are also linked below.
        </p>
      ) : null}

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {CLIPS.map((clip) => {
          const isSelected = clip.id === selected;
          return (
            <li key={clip.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(clip.id)}
                className={`flex w-full flex-col items-start gap-0.5 border p-2 text-left text-[11px] transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-base-content/20 hover:border-base-content/60"
                }`}
              >
                <span className={isSelected ? "text-primary" : ""}>
                  {clip.label}
                </span>
                <span className="opacity-60">{clip.note}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] opacity-60">
        Levels are not matched. The quiet one is quiet because that is what a 10 k
        input does to a pickup.
      </p>
    </div>
  );
}
