"use client";

import { useMemo, useState } from "react";
import measured from "@/data/buffer-response.json";
import {
  dbPos,
  fPos,
  F_MINOR,
  F_TICKS,
  GRID,
  INK,
  MUTED,
  PRIMARY,
  pickupResponseDb,
  responsePath,
  seriesPath,
} from "./chart";

const BOX = { x: 52, y: 24, w: 576, h: 200 };
const WINDOW = { min: -30, max: 20 };
const DB_TICKS = [20, 10, 0, -10, -20, -30];

const PICKUP = { rdc: 6000, henries: 2.3 };
const WINDING_F = 100e-12;
const CABLE_F_PER_M = 100e-12;
/** Measured from the compiled circuit, not assumed: the bias network dominates it. */
const BUFFER_ZIN = 400e3;
/** The patch cable from guitar to pedalboard, in the buffered case. */
const PATCH_M = 0.5;

type PresetId = "cable-1m" | "cable-6m" | "fuzz-load" | "buffered";

const PRESETS: readonly {
  id: PresetId;
  label: string;
  metres: number;
  loadK: number;
  buffered: boolean;
}[] = [
  { id: "cable-1m", label: "1 m cable", metres: 1, loadK: 1000, buffered: false },
  { id: "cable-6m", label: "6 m cable", metres: 6, loadK: 1000, buffered: false },
  { id: "fuzz-load", label: "6 m into a fuzz", metres: 6, loadK: 10, buffered: false },
  { id: "buffered", label: "buffer at the guitar", metres: 6, loadK: 1000, buffered: true },
];

/** Load positions the slider steps through, in kilohms. Log-ish, and all real inputs. */
const LOADS = [10, 22, 47, 68, 100, 220, 470, 1000];

function formatOhms(k: number): string {
  return k >= 1000 ? `${k / 1000} M` : `${k} k`;
}

export function ResponseExplorer() {
  const [metres, setMetres] = useState(6);
  const [loadIndex, setLoadIndex] = useState(LOADS.length - 1);
  const [buffered, setBuffered] = useState(false);

  const loadK = LOADS[loadIndex] ?? 1000;

  // What the pickup actually drives. With a buffer at the guitar, the long cable is on
  // the far side of it, so the pickup sees the patch lead and the buffer's input only.
  const farads =
    WINDING_F + CABLE_F_PER_M * (buffered ? PATCH_M : metres);
  const loadOhms = buffered ? BUFFER_ZIN : loadK * 1000;

  const active = PRESETS.find(
    (p) => p.metres === metres && p.loadK === loadK && p.buffered === buffered,
  );

  const curve = useMemo(
    () => (f: number) => pickupResponseDb(f, { ...PICKUP, farads, loadOhms }),
    [farads, loadOhms],
  );

  const reference = useMemo(
    () => (f: number) =>
      pickupResponseDb(f, {
        ...PICKUP,
        farads: WINDING_F + CABLE_F_PER_M,
        loadOhms: 1e6,
      }),
    [],
  );

  // Readouts: where it peaks, and what is left up top.
  //
  // A heavily loaded pickup has no peak at all -- the curve falls from the bottom of the
  // scan onwards. Reporting the lowest frequency scanned as "the resonance" would be a
  // wrong answer that still renders, so an edge maximum is reported as no resonance.
  const stats = useMemo(() => {
    let peakF = 0;
    let peakDb = -Infinity;
    for (let f = 200; f <= 15_000; f += 10) {
      const db = curve(f);
      if (db > peakDb) {
        peakDb = db;
        peakF = f;
      }
    }
    const resonates = peakF > 220;
    return {
      peakF: resonates ? peakF : null,
      peakDb: resonates ? peakDb : null,
      at5k: curve(5000),
      at10k: curve(10_000),
    };
  }, [curve]);

  const overlay = active
    ? (measured.series as Record<string, { engineDb: number[] }>)[active.id]
    : undefined;

  return (
    <div>
      <svg
        viewBox="0 0 660 300"
        className="w-full min-w-[620px]"
        role="img"
        aria-label={`Frequency response of a guitar pickup into ${
          buffered
            ? "a buffer, whose output drives the cable"
            : `${metres} metres of cable and a ${formatOhms(loadK)}ohm load`
        }. ${
          stats.peakF === null
            ? "The response has no resonant peak: it falls away from the bottom of the range."
            : `The response peaks at ${Math.round(stats.peakF)} hertz at ${stats.peakDb?.toFixed(1)} decibels.`
        } It is ${stats.at10k.toFixed(1)} decibels at 10 kilohertz.`}
      >
        {/* grid */}
        <g stroke={GRID} strokeWidth={1}>
          {F_MINOR.map((f) => (
            <path
              key={f}
              d={`M${BOX.x + fPos(f) * BOX.w} ${BOX.y}L${BOX.x + fPos(f) * BOX.w} ${BOX.y + BOX.h}`}
            />
          ))}
          {DB_TICKS.map((db) => (
            <path
              key={db}
              d={`M${BOX.x} ${BOX.y + BOX.h - dbPos(db, WINDOW.min, WINDOW.max) * BOX.h}L${BOX.x + BOX.w} ${BOX.y + BOX.h - dbPos(db, WINDOW.min, WINDOW.max) * BOX.h}`}
            />
          ))}
        </g>

        {/* zero line, the one the ear reads as "unchanged" */}
        <path
          d={`M${BOX.x} ${BOX.y + BOX.h - dbPos(0, WINDOW.min, WINDOW.max) * BOX.h}L${BOX.x + BOX.w} ${BOX.y + BOX.h - dbPos(0, WINDOW.min, WINDOW.max) * BOX.h}`}
          stroke={MUTED}
          strokeWidth={1}
          fill="none"
        />

        {/* axes */}
        <g stroke={INK} strokeWidth={1.2} fill="none">
          <path d={`M${BOX.x} ${BOX.y}L${BOX.x} ${BOX.y + BOX.h}`} />
          <path
            d={`M${BOX.x} ${BOX.y + BOX.h}L${BOX.x + BOX.w} ${BOX.y + BOX.h}`}
          />
        </g>
        <g
          fill={INK}
          fontSize={10}
          fontFamily="var(--font-mono), monospace"
          style={{ letterSpacing: "0.04em" }}
        >
          {F_TICKS.map((t) => (
            <text
              key={t.f}
              x={BOX.x + fPos(t.f) * BOX.w}
              y={BOX.y + BOX.h + 16}
              textAnchor="middle"
            >
              {t.label}
            </text>
          ))}
          <text
            x={BOX.x + BOX.w}
            y={BOX.y + BOX.h + 30}
            textAnchor="end"
            fill={MUTED}
          >
            Hz
          </text>
          {DB_TICKS.map((db) => (
            <text
              key={db}
              x={BOX.x - 8}
              y={BOX.y + BOX.h - dbPos(db, WINDOW.min, WINDOW.max) * BOX.h + 3}
              textAnchor="end"
            >
              {db > 0 ? `+${db}` : db}
            </text>
          ))}
          <text x={BOX.x - 8} y={BOX.y - 10} textAnchor="end" fill={MUTED}>
            dB
          </text>
        </g>

        {/* reference: 1 m of cable into 1 M, always drawn, so the loss has a baseline */}
        <path
          d={responsePath(reference, BOX, WINDOW)}
          fill="none"
          stroke={MUTED}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />

        {/* the engine's own measurement, when the sliders sit on a rendered circuit */}
        {overlay ? (
          <path
            d={seriesPath(measured.freqs, overlay.engineDb, BOX, WINDOW)}
            fill="none"
            stroke={INK}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeDasharray="1 5"
          />
        ) : null}

        {/* the live model */}
        <path
          d={responsePath(curve, BOX, WINDOW)}
          fill="none"
          stroke={PRIMARY}
          strokeWidth={2}
        />

        {/* where it peaks, when it peaks at all */}
        {stats.peakF !== null && stats.peakDb !== null ? (
          <circle
            cx={BOX.x + fPos(stats.peakF) * BOX.w}
            cy={
              BOX.y + BOX.h - dbPos(stats.peakDb, WINDOW.min, WINDOW.max) * BOX.h
            }
            r={3.5}
            fill={PRIMARY}
          />
        ) : null}

        <g
          fontSize={10}
          fontFamily="var(--font-mono), monospace"
          style={{ letterSpacing: "0.04em" }}
        >
          <text x={BOX.x + 8} y={BOX.y + 14} fill={MUTED}>
            — — 1 m of cable into 1 MΩ (reference)
          </text>
          {overlay ? (
            <text x={BOX.x + 8} y={BOX.y + 28} fill={INK}>
              ····· the same circuit, measured through the engine
            </text>
          ) : null}
        </g>
      </svg>

      {/* controls */}
      <div className="mt-4 flex flex-col gap-4 border-base-content/20 border-t pt-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn btn-xs ${active?.id === preset.id ? "btn-primary" : ""}`}
              onClick={() => {
                setMetres(preset.metres);
                setLoadIndex(LOADS.indexOf(preset.loadK));
                setBuffered(preset.buffered);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[11px]">
              <span>Cable</span>
              <span className={buffered ? "opacity-40" : ""}>
                {metres} m · {Math.round(metres * 100)} pF
              </span>
            </span>
            <input
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={metres}
              onChange={(e) => setMetres(Number(e.target.value))}
              className="range-line"
              style={
                { "--range-val": `${((metres - 0.5) / 11.5) * 100}%` } as React.CSSProperties
              }
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[11px]">
              <span>Pedal input impedance</span>
              <span className={buffered ? "opacity-40" : ""}>
                {formatOhms(loadK)}Ω
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={LOADS.length - 1}
              step={1}
              value={loadIndex}
              onChange={(e) => setLoadIndex(Number(e.target.value))}
              className="range-line"
              style={
                {
                  "--range-val": `${(loadIndex / (LOADS.length - 1)) * 100}%`,
                } as React.CSSProperties
              }
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-[11px]">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={buffered}
            onChange={(e) => setBuffered(e.target.checked)}
          />
          <span>
            Buffer at the guitar
            <span className="opacity-60">
              {" "}
              — the pickup sees {PATCH_M} m and 400 k instead of the cable
            </span>
          </span>
        </label>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-base-content/20 border-t pt-4 text-[11px] sm:grid-cols-4">
          <div>
            <dt className="opacity-60">Resonance</dt>
            <dd>
              {stats.peakF === null
                ? "none"
                : `${Math.round(stats.peakF).toLocaleString()} Hz`}
            </dd>
          </div>
          <div>
            <dt className="opacity-60">Peak</dt>
            <dd>
              {stats.peakDb === null
                ? "—"
                : `${stats.peakDb > 0 ? "+" : ""}${stats.peakDb.toFixed(1)} dB`}
            </dd>
          </div>
          <div>
            <dt className="opacity-60">At 5 kHz</dt>
            <dd>
              {stats.at5k > 0 ? "+" : ""}
              {stats.at5k.toFixed(1)} dB
            </dd>
          </div>
          <div>
            <dt className="opacity-60">At 10 kHz</dt>
            <dd className={stats.at10k < -10 ? "text-primary" : ""}>
              {stats.at10k > 0 ? "+" : ""}
              {stats.at10k.toFixed(1)} dB
            </dd>
          </div>
        </dl>
        <p className="text-[11px] opacity-60">
          Readouts are the circuit solved exactly, with the buffer stood in for by its
          input impedance. The engine, sampling at 48 kHz and simulating the actual
          transistor, lands a little lower — the dotted overlay is where it lands, and
          Fig 6 measures the gap.
        </p>
      </div>
    </div>
  );
}
