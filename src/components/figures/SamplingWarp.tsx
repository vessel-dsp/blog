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
  seriesPath,
} from "./chart";

const BOX = { x: 52, y: 14, w: 576, h: 190 };
const WINDOW = { min: -25, max: 20 };
const DB_TICKS = [20, 10, 0, -10, -20];

/**
 * The compromise, drawn. The engine and the closed-form circuit agree to within a tenth
 * of a decibel across the band a guitar mostly occupies, and then disagree exactly where
 * the resonance is -- because a resonance near Nyquist is the thing discrete time is
 * worst at. Raising the rate walks it back, and costs what raising the rate costs.
 */
export function SamplingWarp() {
  const series = (
    measured.series as Record<string, { engineDb: number[]; modelDb: number[] }>
  )["cable-1m"];
  if (!series) return null;
  const peak = measured.peakByRate;

  return (
    <div>
      <svg
        viewBox="0 0 660 250"
        className="w-full min-w-[620px]"
        role="img"
        aria-label="The 1 metre cable circuit's response, measured through the engine at 48 kilohertz and computed from the continuous-time circuit equations. The two agree below about 2.5 kilohertz and diverge near the resonant peak, where the engine's peak sits about 490 hertz lower."
      >
        <title>Where the real-time engine departs from the circuit</title>

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

        <g stroke={INK} strokeWidth={1.2} fill="none">
          <path d={`M${BOX.x} ${BOX.y}L${BOX.x} ${BOX.y + BOX.h}`} />
          <path d={`M${BOX.x} ${BOX.y + BOX.h}L${BOX.x + BOX.w} ${BOX.y + BOX.h}`} />
        </g>

        {/* the band where they agree */}
        <rect
          x={BOX.x}
          y={BOX.y}
          width={fPos(2500) * BOX.w}
          height={BOX.h}
          fill={INK}
          opacity={0.04}
        />
        <text
          x={BOX.x + 8}
          y={BOX.y + BOX.h - 8}
          fontSize={10}
          fill={MUTED}
          fontFamily="var(--font-mono), monospace"
          style={{ letterSpacing: "0.04em" }}
        >
          agree within 0.02 dB
        </text>

        <path
          d={seriesPath(measured.freqs, series.modelDb, BOX, WINDOW)}
          fill="none"
          stroke={MUTED}
          strokeWidth={1.6}
          strokeDasharray="4 3"
        />
        <path
          d={seriesPath(measured.freqs, series.engineDb, BOX, WINDOW)}
          fill="none"
          stroke={PRIMARY}
          strokeWidth={2}
        />

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
          <text x={BOX.x + 8} y={BOX.y + 14} fill={PRIMARY}>
            —— the engine, at 48 kHz
          </text>
          <text x={BOX.x + 8} y={BOX.y + 28} fill={MUTED}>
            — — the circuit, solved exactly
          </text>
        </g>
      </svg>

      <table className="mt-4 w-full border-collapse text-[11px]">
        <caption className="pb-2 text-left opacity-60">
          Where the resonant peak lands, by sample rate
        </caption>
        <thead>
          <tr className="border-base-content/20 border-b">
            <th className="py-1 text-left font-normal">Rate</th>
            <th className="py-1 text-right font-normal">Peak</th>
            <th className="py-1 text-right font-normal">Off by</th>
            <th className="py-1 text-right font-normal">Height</th>
          </tr>
        </thead>
        <tbody>
          {peak.rates.map((row) => (
            <tr key={row.rate} className="border-base-content/10 border-b">
              <td className="py-1">{row.rate / 1000} kHz</td>
              <td className="py-1 text-right">{row.hz.toLocaleString()} Hz</td>
              <td
                className={`py-1 text-right ${Math.abs(row.hz - peak.modelHz) > 100 ? "text-primary" : ""}`}
              >
                {row.hz - peak.modelHz > 0 ? "+" : ""}
                {row.hz - peak.modelHz} Hz
              </td>
              <td className="py-1 text-right">
                {(row.db - peak.modelDb).toFixed(2)} dB
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-1 opacity-60">the circuit</td>
            <td className="py-1 text-right opacity-60">
              {peak.modelHz.toLocaleString()} Hz
            </td>
            <td className="py-1 text-right opacity-60">—</td>
            <td className="py-1 text-right opacity-60">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
