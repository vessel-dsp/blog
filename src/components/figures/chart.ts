/**
 * Chart primitives shared by every figure in a post: one frequency scale, one dB scale,
 * one set of ticks. They live outside the components because the interactive figure and
 * the static ones must agree exactly -- a reader comparing two figures is comparing the
 * axes first, whether or not they notice.
 */

export const F_MIN = 20;
export const F_MAX = 15_000;

/** Frequency -> 0..1, logarithmic. Audio is logarithmic; a linear axis hides the knee. */
export function fPos(f: number): number {
  return Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN);
}

/** dB -> 0..1 within the given window, clamped so a spike cannot leave the frame. */
export function dbPos(db: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (db - min) / (max - min)));
}

export const F_TICKS: readonly { f: number; label: string }[] = [
  { f: 20, label: "20" },
  { f: 100, label: "100" },
  { f: 1000, label: "1k" },
  { f: 10_000, label: "10k" },
];

/** Minor gridlines: the decade fill-in, unlabelled. */
export const F_MINOR: readonly number[] = [
  30, 40, 50, 60, 70, 80, 90, 200, 300, 400, 500, 600, 700, 800, 900, 2000,
  3000, 4000, 5000, 6000, 7000, 8000, 9000,
];

/**
 * The pickup-into-load transfer function, as a magnitude in dB.
 *
 * A guitar pickup is a coil: a resistance and an inductance in series, driving whatever
 * capacitance and resistance hang off it. That series inductance and shunt capacitance
 * form a resonant low-pass, which is why the curve peaks before it falls.
 *
 *   H(jw) = Zshunt / (Rdc + jwL + Zshunt),  Zshunt = 1 / (1/Rload + jwC)
 *
 * Continuous time, so it is the answer the circuit gives with no sampling in the way.
 * `SamplingWarp` shows where the real-time engine departs from it, and by how much.
 */
export function pickupResponseDb(
  f: number,
  options: { rdc: number; henries: number; farads: number; loadOhms: number },
): number {
  const { rdc, henries, farads, loadOhms } = options;
  const w = 2 * Math.PI * f;
  const yr = 1 / loadOhms;
  const yi = w * farads;
  const ymag2 = yr * yr + yi * yi;
  const zsr = yr / ymag2;
  const zsi = -yi / ymag2;
  const dr = rdc + zsr;
  const di = w * henries + zsi;
  const dmag2 = dr * dr + di * di;
  const hr = (zsr * dr + zsi * di) / dmag2;
  const hi = (zsi * dr - zsr * di) / dmag2;
  return 20 * Math.log10(Math.sqrt(hr * hr + hi * hi));
}

/** An SVG path across the frequency axis, sampled densely enough to keep the peak. */
export function responsePath(
  db: (f: number) => number,
  box: { x: number; y: number; w: number; h: number },
  window: { min: number; max: number },
  steps = 240,
): string {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const f = F_MIN * Math.pow(F_MAX / F_MIN, i / steps);
    const x = box.x + fPos(f) * box.w;
    const y = box.y + box.h - dbPos(db(f), window.min, window.max) * box.h;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

/** Points -> path, for a measured series that already has its own frequency list. */
export function seriesPath(
  freqs: readonly number[],
  values: readonly number[],
  box: { x: number; y: number; w: number; h: number },
  window: { min: number; max: number },
): string {
  let d = "";
  let started = false;
  freqs.forEach((f, i) => {
    const v = values[i];
    if (v === undefined || f < F_MIN || f > F_MAX) return;
    const x = box.x + fPos(f) * box.w;
    const y = box.y + box.h - dbPos(v, window.min, window.max) * box.h;
    d += `${started ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    started = true;
  });
  return d;
}

export const INK = "#1d1d1d";
export const PRIMARY = "#ff513a";
export const MUTED = "#a6a6a6";
export const GRID = "#e5e5e5";
