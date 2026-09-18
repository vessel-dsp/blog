import { GRID, INK, MUTED, PRIMARY } from "./chart";
import { Tag } from "./symbols";

const X0 = 56;
const W = 572;
const DECADES = 6; // 10 ohm -> 10 Mohm
const AXIS = 148;

function xOf(ohms: number): number {
  return X0 + (Math.log10(ohms / 10) / DECADES) * W;
}

const TICKS = [
  { ohms: 10, label: "10 Ω" },
  { ohms: 100, label: "100 Ω" },
  { ohms: 1e3, label: "1 kΩ" },
  { ohms: 10e3, label: "10 kΩ" },
  { ohms: 100e3, label: "100 kΩ" },
  { ohms: 1e6, label: "1 MΩ" },
  { ohms: 10e6, label: "10 MΩ" },
];

/** |Z| of the pickup at a frequency: a resistance and an inductance in series. */
function pickupOhms(f: number): number {
  return Math.sqrt(6000 ** 2 + (2 * Math.PI * f * 2.3) ** 2);
}

/**
 * Impedance is the whole argument, so it gets an axis of its own. What matters is not
 * where any one marker sits but the distance between the thing driving and the thing
 * driven -- and that the guitar's marker is a range, not a point.
 */
export function ImpedanceLadder() {
  const low = pickupOhms(100);
  const high = pickupOhms(10_000);

  return (
    <svg
      viewBox="0 0 660 250"
      className="w-full min-w-[620px]"
      role="img"
      aria-label="A logarithmic impedance axis from 10 ohms to 10 megohms. The guitar pickup spans 6 kilohms at low frequencies to 145 kilohms at 10 kilohertz. A buffer output sits at about 100 ohms. Loads shown are a vintage fuzz at 10 kilohms, this buffer's input at 400 kilohms, and a typical amplifier input at 1 megohm."
    >
      <title>What drives what, on one impedance axis</title>

      <Tag x={X0} y={26} anchor="start" color={MUTED} size={10}>
        what drives
      </Tag>

      {/* the pickup: a range, because it is an inductor */}
      <g>
        <rect
          x={xOf(low)}
          y={54}
          width={xOf(high) - xOf(low)}
          height={13}
          fill={INK}
          opacity={0.14}
        />
        <path
          d={`M${xOf(low)} 54L${xOf(low)} 67M${xOf(high)} 54L${xOf(high)} 67`}
          stroke={INK}
          strokeWidth={1.4}
        />
        <Tag x={xOf(low)} y={48} anchor="start">
          guitar pickup
        </Tag>
        <Tag x={xOf(low)} y={86} anchor="start" size={10} color={MUTED} caps={false}>
          6 kΩ on low notes → 145 kΩ at 10 kHz
        </Tag>
      </g>

      {/* the buffer output */}
      <g>
        <path
          d={`M${xOf(100)} 100L${xOf(100)} ${AXIS}`}
          stroke={PRIMARY}
          strokeWidth={1.6}
        />
        <circle cx={xOf(100)} cy={100} r={4} fill={PRIMARY} />
        <Tag x={xOf(100)} y={88} color={PRIMARY}>
          buffer output
        </Tag>
        <Tag x={xOf(100) + 12} y={120} anchor="start" size={10} color={MUTED} caps={false}>
          ≈ 100 Ω, and flat
        </Tag>
      </g>

      {/* axis */}
      <path
        d={`M${X0} ${AXIS}L${X0 + W} ${AXIS}`}
        stroke={INK}
        strokeWidth={1.2}
      />
      {TICKS.map((tick) => (
        <g key={tick.ohms}>
          <path
            d={`M${xOf(tick.ohms)} ${AXIS}L${xOf(tick.ohms)} ${AXIS + 5}`}
            stroke={INK}
            strokeWidth={1}
          />
          <path
            d={`M${xOf(tick.ohms)} 40L${xOf(tick.ohms)} ${AXIS}`}
            stroke={GRID}
            strokeWidth={1}
          />
          <Tag x={xOf(tick.ohms)} y={AXIS + 18} size={10} color={MUTED} caps={false}>
            {tick.label}
          </Tag>
        </g>
      ))}

      <Tag x={X0} y={AXIS + 44} anchor="start" color={MUTED} size={10}>
        what it drives into
      </Tag>

      {/* loads */}
      <g>
        <circle cx={xOf(10e3)} cy={AXIS + 64} r={4} fill={INK} />
        <path
          d={`M${xOf(10e3)} ${AXIS}L${xOf(10e3)} ${AXIS + 64}`}
          stroke={INK}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        <Tag x={xOf(10e3)} y={AXIS + 80} size={11}>
          vintage fuzz
        </Tag>
        <Tag x={xOf(10e3)} y={AXIS + 94} size={10} color={MUTED} caps={false}>
          10 kΩ
        </Tag>
      </g>
      <g>
        <circle cx={xOf(400e3)} cy={AXIS + 64} r={4} fill={PRIMARY} />
        <path
          d={`M${xOf(400e3)} ${AXIS}L${xOf(400e3)} ${AXIS + 64}`}
          stroke={PRIMARY}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        <Tag x={xOf(400e3)} y={AXIS + 80} anchor="end" size={11} color={PRIMARY}>
          this buffer in
        </Tag>
        <Tag x={xOf(400e3)} y={AXIS + 94} anchor="end" size={10} color={MUTED} caps={false}>
          400 kΩ
        </Tag>
      </g>
      <g>
        <circle cx={xOf(1e6)} cy={AXIS + 34} r={4} fill={INK} />
        <path
          d={`M${xOf(1e6)} ${AXIS}L${xOf(1e6)} ${AXIS + 34}`}
          stroke={INK}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        <Tag x={xOf(1e6) + 12} y={AXIS + 32} anchor="start" size={11}>
          amp input
        </Tag>
        <Tag x={xOf(1e6) + 12} y={AXIS + 46} anchor="start" size={10} color={MUTED} caps={false}>
          1 MΩ
        </Tag>
      </g>
    </svg>
  );
}
