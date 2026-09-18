import { INK, MUTED, PRIMARY } from "./chart";
import {
  CapacitorV,
  Ground,
  InductorH,
  Node,
  ResistorH,
  ResistorV,
  SourceCircle,
  Tag,
} from "./symbols";

const SIG = 96;
const GND = 196;

/** The bracket that names a region of the schematic. */
function Brace({
  x1,
  x2,
  y,
  label,
  color = INK,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  color?: string;
}) {
  return (
    <g>
      <path
        d={`M${x1} ${y + 6}L${x1} ${y}L${x2} ${y}L${x2} ${y + 6}`}
        fill="none"
        stroke={color}
        strokeWidth={1}
      />
      <Tag x={(x1 + x2) / 2} y={y - 7} color={color}>
        {label}
      </Tag>
    </g>
  );
}

/**
 * What the circuit downstream actually sees when you plug a guitar into it: not a
 * voltage source, but a coil with a resistance and an inductance, and then whatever
 * capacitance and load hang off the far end of it.
 */
export function PickupModel() {
  return (
    <svg
      viewBox="0 0 700 250"
      className="w-full min-w-[620px]"
      role="img"
      aria-label="Schematic of a guitar pickup as a circuit: a 6 kilohm winding resistance in series with a 2.3 henry inductance, feeding a node loaded by the winding and cable capacitance to ground and by the amplifier input resistance to ground."
    >
      <title>A guitar pickup, as the next circuit sees it</title>

      <Brace x1={40} x2={290} y={44} label="the guitar" />
      <Brace x1={330} x2={620} y={44} label="what it has to drive" color={PRIMARY} />

      {/* signal path */}
      <g fill="none" stroke={INK} strokeWidth={1.6}>
        <path d={`M60 ${SIG - 18}L60 ${SIG}L100 ${SIG}`} />
        <path d={`M160 ${SIG}L200 ${SIG}`} />
        <path d={`M270 ${SIG}L610 ${SIG}`} />
        <path d={`M60 ${SIG + 18}L60 ${GND}L610 ${GND}`} />
      </g>

      <SourceCircle x={60} y={SIG + 50} />
      <ResistorH x={100} y={SIG} w={60} />
      <InductorH x={200} y={SIG} w={70} />
      <CapacitorV x={360} y={SIG} h={100} />
      <ResistorV x={470} y={SIG} h={100} />
      <Ground x={230} y={GND} />
      <Node x={360} y={SIG} />
      <Node x={470} y={SIG} />
      <Node x={360} y={GND} />
      <Node x={470} y={GND} />

      {/* values, in their own case: uppercasing a unit is how pF becomes PF */}
      <Tag x={130} y={SIG - 18} caps={false}>
        6 kΩ
      </Tag>
      <Tag x={235} y={SIG - 18} caps={false}>
        2.3 H
      </Tag>
      <Tag x={336} y={SIG + 44} anchor="end" color={PRIMARY} caps={false}>
        100 pF + 100 pF/m
      </Tag>
      <Tag x={486} y={SIG + 44} anchor="start" caps={false}>
        1 MΩ
      </Tag>

      {/* roles, short enough not to collide */}
      <Tag x={130} y={SIG + 26} color={MUTED} size={10}>
        resistance
      </Tag>
      <Tag x={235} y={SIG + 26} color={MUTED} size={10}>
        inductance
      </Tag>
      <Tag x={336} y={SIG + 60} anchor="end" color={MUTED} size={10}>
        winding + cable
      </Tag>
      <Tag x={486} y={SIG + 60} anchor="start" color={MUTED} size={10}>
        input impedance
      </Tag>
      <Tag x={610} y={SIG - 12} anchor="end" size={10} color={MUTED}>
        out
      </Tag>

      {/* the point of the whole drawing */}
      <path d="M300 222L470 222" stroke={PRIMARY} strokeWidth={1} fill="none" />
      <Tag x={385} y={238} color={PRIMARY} size={10}>
        an inductor and a capacitor: this resonates
      </Tag>
    </svg>
  );
}
