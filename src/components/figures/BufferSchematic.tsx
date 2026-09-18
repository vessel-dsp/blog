import { INK, MUTED, PRIMARY } from "./chart";
import {
  CapacitorH,
  CapacitorV,
  Ground,
  Node,
  NpnTransistor,
  ResistorV,
  Tag,
} from "./symbols";

const RAIL = 44;
const SIG = 150;
const EMIT = 206;
const GND = 268;

/**
 * The whole buffer, with the two numbers that matter called out: what it presents to
 * the guitar, and what it presents to the cable. Everything else on the drawing exists
 * to produce those two numbers.
 */
export function BufferSchematic() {
  return (
    <svg
      viewBox="0 0 760 330"
      className="w-full min-w-[680px]"
      role="img"
      aria-label="Schematic of a 2N3904 emitter-follower buffer on a 9 volt supply: a 100 nanofarad input capacitor into a base biased by two 1 megohm resistors, collector to the supply rail, a 10 kilohm emitter resistor, and a 1 microfarad output capacitor driving 6 metres of cable into a 1 megohm load."
    >
      <title>An emitter-follower buffer, and the two impedances it exists to set</title>

      {/* supply rail */}
      <g fill="none" stroke={INK} strokeWidth={1.6}>
        <path d={`M200 ${RAIL}L430 ${RAIL}`} />
        <path d={`M200 ${RAIL}L200 ${RAIL + 12}`} />
        <path d={`M315 ${RAIL}L315 ${SIG - 36}`} />
      </g>
      <Tag x={445} y={RAIL + 4} anchor="start">
        +9 V
      </Tag>

      {/* input side */}
      <g fill="none" stroke={INK} strokeWidth={1.6}>
        <path d={`M40 ${SIG}L70 ${SIG}`} />
        <path d={`M130 ${SIG}L280 ${SIG}`} />
      </g>
      <CapacitorH x={70} y={SIG} w={60} />
      <Tag x={100} y={SIG - 22} caps={false}>
        100 nF
      </Tag>
      <Tag x={40} y={SIG + 22} anchor="start" size={10} color={MUTED}>
        from guitar
      </Tag>

      {/* bias network */}
      <ResistorV x={200} y={RAIL + 12} h={54} />
      <g fill="none" stroke={INK} strokeWidth={1.6}>
        <path d={`M200 ${RAIL + 66}L200 ${SIG}`} />
        <path d={`M200 ${SIG}L200 ${SIG + 14}`} />
      </g>
      <ResistorV x={200} y={SIG + 14} h={54} />
      <g fill="none" stroke={INK} strokeWidth={1.6}>
        <path d={`M200 ${SIG + 68}L200 ${GND}`} />
      </g>
      <Node x={200} y={SIG} />
      <Tag x={185} y={RAIL + 44} anchor="end" caps={false}>
        1 MΩ
      </Tag>
      <Tag x={185} y={SIG + 46} anchor="end" caps={false}>
        1 MΩ
      </Tag>

      {/* device */}
      <NpnTransistor x={300} y={SIG} r={26} />
      <Tag x={348} y={SIG - 26} anchor="start" size={10} color={MUTED} caps={false}>
        2N3904
      </Tag>

      {/* emitter side */}
      <g fill="none" stroke={INK} strokeWidth={1.6}>
        <path d={`M315 ${SIG + 36}L315 ${EMIT}`} />
        <path d={`M315 ${EMIT}L360 ${EMIT}`} />
        <path d={`M420 ${EMIT}L620 ${EMIT}`} />
        <path d={`M200 ${GND}L620 ${GND}`} />
      </g>
      <ResistorV x={315} y={EMIT} h={62} />
      <Node x={315} y={EMIT} />
      <Tag x={300} y={EMIT + 40} anchor="end" caps={false}>
        10 kΩ
      </Tag>
      <CapacitorH x={360} y={EMIT} w={60} />
      <Tag x={390} y={EMIT - 24} caps={false}>
        1 µF
      </Tag>

      {/* what the buffer drives */}
      <CapacitorV x={480} y={EMIT} h={62} />
      <ResistorV x={570} y={EMIT} h={62} />
      <Node x={480} y={EMIT} />
      <Node x={570} y={EMIT} />
      <Node x={315} y={GND} />
      <Node x={480} y={GND} />
      <Node x={570} y={GND} />
      <Ground x={410} y={GND} />
      <Tag x={458} y={EMIT + 30} anchor="end" color={PRIMARY} caps={false}>
        600 pF
      </Tag>
      <Tag x={458} y={EMIT + 46} anchor="end" size={10} color={MUTED} caps={false}>
        6 m of cable
      </Tag>
      <Tag x={586} y={EMIT + 30} anchor="start" caps={false}>
        1 MΩ
      </Tag>
      <Tag x={586} y={EMIT + 46} anchor="start" size={10} color={MUTED}>
        amp
      </Tag>
      <Tag x={620} y={EMIT - 14} anchor="end" size={10} color={MUTED}>
        out
      </Tag>

      {/* the two numbers the whole drawing exists to produce */}
      <g>
        <Tag x={40} y={SIG + 92} anchor="start" color={PRIMARY} caps={false}>
          Zin ≈ 400 kΩ
        </Tag>
        <Tag x={40} y={SIG + 108} anchor="start" size={10} color={MUTED}>
          set by the two 1 M resistors,
        </Tag>
        <Tag x={40} y={SIG + 122} anchor="start" size={10} color={MUTED}>
          not by the transistor
        </Tag>
      </g>
      <Tag x={450} y={EMIT - 24} anchor="start" color={PRIMARY} caps={false}>
        Zout ≈ 100 Ω
      </Tag>
    </svg>
  );
}
