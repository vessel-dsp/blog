/**
 * Measure every circuit in the Buffer post through the VesselDSP engine and write the
 * curve data the post's figures plot.
 *
 * The figures are measurements, not illustrations, and this is where the measurement
 * happens. It also records the closed-form answer next to the engine's, so the post can
 * state the disagreement as a number instead of claiming there isn't one.
 *
 * Needs the audio-engine checkout beside this repo, because the compiler and runtime are
 * not published packages yet:
 *
 *   bun scripts/measure-buffer-response.ts
 *
 * Writes src/data/buffer-response.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const engine = resolve(repo, "..", "workbench");

const { compile } = await import(join(engine, "src/compiler/compile.ts"));
const { pedalPartCatalog } = await import(
  join(engine, "src/compiler/part-catalog.ts")
);
const { ReferenceRuntime } = await import(
  join(engine, "src/runtime/reference-runtime.ts")
);

const RATE = 48_000;
/** Small enough to keep every circuit linear: this network has a resonant rise in it. */
const AMPLITUDE = 0.05;
const PICKUP_RDC = 6000;
const PICKUP_L = 2.3;

/** The circuit solved exactly, with no sampling in the way. */
function analyticDb(f: number, farads: number, loadOhms: number): number {
  const w = 2 * Math.PI * f;
  const yr = 1 / loadOhms;
  const yi = w * farads;
  const ymag2 = yr * yr + yi * yi;
  const zsr = yr / ymag2;
  const zsi = -yi / ymag2;
  const dr = PICKUP_RDC + zsr;
  const di = w * PICKUP_L + zsi;
  const dmag2 = dr * dr + di * di;
  const hr = (zsr * dr + zsi * di) / dmag2;
  const hi = (zsi * dr - zsr * di) / dmag2;
  return 20 * Math.log10(Math.sqrt(hr * hr + hi * hi));
}

const CASES = [
  { id: "cable-1m", file: "pickup-cable-1m", farads: 200e-12, load: 1e6, peak: [4000, 11000] },
  { id: "cable-6m", file: "pickup-cable-6m", farads: 700e-12, load: 1e6, peak: [2000, 7000] },
  { id: "fuzz-load", file: "pickup-cable-6m-fuzz", farads: 700e-12, load: 10e3, peak: null },
  { id: "buffered", file: "pickup-buffer-cable-6m", farads: 150e-12, load: 400e3, peak: [4000, 12000] },
] as const;

/** Dense enough that the resonant peak is a peak and not a corner. */
const POINTS = 160;
const freqs: number[] = [];
for (let i = 0; i <= POINTS; i++) {
  freqs.push(Math.round(20 * Math.pow(15_000 / 20, i / POINTS)));
}

type Runtime = {
  prepare: (rate: number, options: { inputSourceOhms: number }) => void;
  process: (input: Float64Array) => Float64Array;
};

/** Steady-state gain at one frequency, with the bias settled first. */
function gainDb(program: unknown, f: number, rate = RATE): number {
  const runtime = new ReferenceRuntime(program) as Runtime;
  runtime.prepare(rate, { inputSourceOhms: 0 });
  // Charge the coupling capacitors before measuring, or the first circuit with a
  // transistor in it reports its power-on transient as frequency response.
  runtime.process(new Float64Array(Math.round(rate * 0.3)));
  const n = Math.round(rate * 0.3);
  const input = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    input[i] = AMPLITUDE * Math.sin((2 * Math.PI * f * i) / rate);
  }
  const output = runtime.process(input);
  const from = Math.round(rate * 0.18);
  let so = 0;
  let si = 0;
  for (let i = from; i < n; i++) {
    so += (output[i] ?? 0) ** 2;
    si += (input[i] ?? 0) ** 2;
  }
  return 20 * Math.log10(Math.sqrt(so / si));
}

const series: Record<string, { engineDb: number[]; modelDb: number[] }> = {};
const summary: Record<string, unknown> = {};

for (const kase of CASES) {
  const source = readFileSync(
    join(repo, "content/circuits", `${kase.file}.vdsp`),
    "utf8",
  );
  const result = compile(source, { registry: pedalPartCatalog });
  if (result.status !== "ok") {
    throw new Error(`${kase.id}: compiler said ${result.status}`);
  }
  const engineDb = freqs.map((f) => Number(gainDb(result.program, f).toFixed(3)));
  const modelDb = freqs.map((f) =>
    Number(analyticDb(f, kase.farads, kase.load).toFixed(3)),
  );
  series[kase.id] = { engineDb, modelDb };

  // The peak, found finely: the plotting grid is too coarse to quote a resonance from.
  let peakHz: number | null = null;
  let peakDb: number | null = null;
  if (kase.peak) {
    let best = -Infinity;
    for (let f = kase.peak[0]; f <= kase.peak[1]; f += 25) {
      const db = gainDb(result.program, f);
      if (db > best) {
        best = db;
        peakHz = f;
      }
    }
    peakDb = Number(best.toFixed(2));
  }
  const at = (hz: number) => engineDb[freqs.findIndex((f) => f >= hz)] ?? 0;
  summary[kase.id] = { peakHz, peakDb, at200: at(200), at5k: at(5000), at10k: at(10_000) };
  console.log(
    `${kase.id.padEnd(10)} peak ${peakHz ? `${peakHz} Hz ${peakDb} dB` : "none"} | 200 ${at(200).toFixed(2)} | 5k ${at(5000).toFixed(2)} | 10k ${at(10_000).toFixed(2)}`,
  );
}

// How far the engine's resonance moves with sample rate: the compromise, measured.
const rateSource = readFileSync(
  join(repo, "content/circuits/pickup-cable-1m.vdsp"),
  "utf8",
);
const rateResult = compile(rateSource, { registry: pedalPartCatalog });
if (rateResult.status !== "ok") throw new Error("cable-1m did not compile");

let modelHz = 0;
let modelDb = -Infinity;
for (let f = 4000; f <= 12_000; f += 10) {
  const db = analyticDb(f, 200e-12, 1e6);
  if (db > modelDb) {
    modelDb = db;
    modelHz = f;
  }
}

const rates = [];
for (const rate of [48_000, 96_000, 192_000, 384_000]) {
  let hz = 0;
  let db = -Infinity;
  for (let f = 4000; f <= 12_000; f += 25) {
    const value = gainDb(rateResult.program, f, rate);
    if (value > db) {
      db = value;
      hz = f;
    }
  }
  rates.push({ rate, hz, db: Number(db.toFixed(2)) });
  console.log(`peak @ ${rate} Hz: ${hz} Hz ${db.toFixed(2)} dB (off by ${hz - modelHz} Hz)`);
}

writeFileSync(
  join(repo, "src/data/buffer-response.json"),
  JSON.stringify({
    rate: RATE,
    freqs,
    series,
    summary,
    peakByRate: { modelHz, modelDb: Number(modelDb.toFixed(2)), rates },
  }),
);
console.log("\nwrote src/data/buffer-response.json");
