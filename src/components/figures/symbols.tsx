/**
 * Schematic symbols, drawn rather than imported, so every figure in the post uses the
 * same stroke weight and the same idiom. All of them take a start point and a length
 * and draw along one axis, which keeps the call sites readable as a netlist.
 */
import { INK } from "./chart";

const STROKE = 1.6;

/** Horizontal resistor: zigzag between two leads. */
export function ResistorH({ x, y, w = 56 }: { x: number; y: number; w?: number }) {
  const lead = w * 0.18;
  const body = w - lead * 2;
  const step = body / 6;
  let d = `M${x} ${y}L${x + lead} ${y}`;
  for (let i = 0; i < 6; i++) {
    const px = x + lead + step * i + step / 2;
    d += `L${px} ${y + (i % 2 === 0 ? -7 : 7)}`;
  }
  d += `L${x + lead + body} ${y}L${x + w} ${y}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={STROKE} />;
}

/** Vertical resistor, drawn downward from (x, y). */
export function ResistorV({ x, y, h = 56 }: { x: number; y: number; h?: number }) {
  const lead = h * 0.18;
  const body = h - lead * 2;
  const step = body / 6;
  let d = `M${x} ${y}L${x} ${y + lead}`;
  for (let i = 0; i < 6; i++) {
    const py = y + lead + step * i + step / 2;
    d += `L${x + (i % 2 === 0 ? -7 : 7)} ${py}`;
  }
  d += `L${x} ${y + lead + body}L${x} ${y + h}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={STROKE} />;
}

/** Horizontal inductor: four bumps on the wire. */
export function InductorH({ x, y, w = 56 }: { x: number; y: number; w?: number }) {
  const lead = w * 0.12;
  const body = w - lead * 2;
  const r = body / 8;
  let d = `M${x} ${y}L${x + lead} ${y}`;
  for (let i = 0; i < 4; i++) {
    const sx = x + lead + i * r * 2;
    d += `A${r} ${r} 0 0 1 ${sx + r * 2} ${y}`;
  }
  d += `L${x + w} ${y}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={STROKE} />;
}

/** Capacitor to ground: two plates, drawn downward from (x, y). */
export function CapacitorV({ x, y, h = 40 }: { x: number; y: number; h?: number }) {
  const mid = y + h / 2;
  return (
    <g fill="none" stroke={INK} strokeWidth={STROKE}>
      <path d={`M${x} ${y}L${x} ${mid - 4}`} />
      <path d={`M${x - 13} ${mid - 4}L${x + 13} ${mid - 4}`} />
      <path d={`M${x - 13} ${mid + 4}L${x + 13} ${mid + 4}`} />
      <path d={`M${x} ${mid + 4}L${x} ${y + h}`} />
    </g>
  );
}

/** Horizontal capacitor, in series along the wire. */
export function CapacitorH({ x, y, w = 40 }: { x: number; y: number; w?: number }) {
  const mid = x + w / 2;
  return (
    <g fill="none" stroke={INK} strokeWidth={STROKE}>
      <path d={`M${x} ${y}L${mid - 4} ${y}`} />
      <path d={`M${mid - 4} ${y - 13}L${mid - 4} ${y + 13}`} />
      <path d={`M${mid + 4} ${y - 13}L${mid + 4} ${y + 13}`} />
      <path d={`M${mid + 4} ${y}L${x + w} ${y}`} />
    </g>
  );
}

/** Ground: the three shrinking bars. */
export function Ground({ x, y }: { x: number; y: number }) {
  return (
    <g fill="none" stroke={INK} strokeWidth={STROKE}>
      <path d={`M${x - 12} ${y}L${x + 12} ${y}`} />
      <path d={`M${x - 7} ${y + 5}L${x + 7} ${y + 5}`} />
      <path d={`M${x - 2.5} ${y + 10}L${x + 2.5} ${y + 10}`} />
    </g>
  );
}

/** A connection dot, for a node three or more things meet at. */
export function Node({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3.2} fill={INK} />;
}

/** NPN transistor, base on the left, collector up, emitter down. */
export function NpnTransistor({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
  const barX = x - r * 0.18;
  return (
    <g fill="none" stroke={INK} strokeWidth={STROKE}>
      <circle cx={x} cy={y} r={r} />
      <path d={`M${barX - 16} ${y}L${barX} ${y}`} />
      <path d={`M${barX} ${y - 13}L${barX} ${y + 13}`} />
      <path d={`M${barX} ${y - 7}L${x + 15} ${y - 17}`} />
      <path d={`M${barX} ${y + 7}L${x + 15} ${y + 17}`} />
      {/* emitter arrow, which is what makes it an NPN rather than a PNP */}
      <path
        d={`M${x + 8} ${y + 12.7}L${x + 15} ${y + 17}L${x + 6.6} ${y + 18}Z`}
        fill={INK}
      />
      <path d={`M${x + 15} ${y - 17}L${x + 15} ${y - r - 10}`} />
      <path d={`M${x + 15} ${y + 17}L${x + 15} ${y + r + 10}`} />
    </g>
  );
}

/** Signal source: the guitar, as the circuit sees it. */
export function SourceCircle({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  return (
    <g fill="none" stroke={INK} strokeWidth={STROKE}>
      <circle cx={x} cy={y} r={r} />
      <path
        d={`M${x - 9} ${y}Q${x - 4.5} ${y - 9} ${x} ${y}T${x + 9} ${y}`}
      />
    </g>
  );
}

/**
 * Small mono label. `anchor` follows SVG text-anchor.
 *
 * `caps` is off for anything carrying a unit, and that is not a style preference: CSS
 * `text-transform: uppercase` turns `1 µF` into `1 ΜF` -- a capital Greek mu, which reads
 * as one megafarad. Values keep their own case; prose labels take the brand's uppercase.
 */
export function Tag({
  x,
  y,
  children,
  anchor = "middle",
  color = INK,
  size = 11,
  caps = true,
}: {
  x: number;
  y: number;
  children: string;
  anchor?: "start" | "middle" | "end";
  color?: string;
  size?: number;
  caps?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color}
      fontSize={size}
      fontFamily="var(--font-mono), monospace"
      style={{
        textTransform: caps ? "uppercase" : "none",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </text>
  );
}
