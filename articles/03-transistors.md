---
title: Transistors
status: placeholder
tier: whitebox (compact MNA)
devices_available: 90 (70 BJT, 20 JFET, 0 MOSFET)
---

# Transistors

> **Placeholder.** Structure and known facts only. Nothing here is measured yet.

Three devices in one article because they occupy the same slot in a circuit and
almost nothing else about them is the same.

## Introduction

**BJT** — current-controlled. The fuzz device. Fuzz Face, Tone Bender, Big Muff,
Rangemaster. Germanium versus silicon here is not a subtle swap; leakage and
temperature drift are part of the sound, and germanium's saturation current sits
about five orders of magnitude from silicon's.

**JFET** — voltage-controlled, depletion mode, conducts with no gate bias. Used to
imitate tube stages and as a switching element. J201 and 2N5457 are the pedal
staples, and their parameter spread from part to part is famously wide.

**MOSFET** — voltage-controlled, enhancement mode. Clipping element, boost stage,
and body-diode clipper.

Why the model matters: a transistor stage's bias point determines almost everything
audible about it, and bias is exactly what a careless model gets wrong. A Fuzz Face
that is biased right and a Fuzz Face that is biased wrong are different pedals.

## How to model it

Compact device laws stamped into the MNA matrix, solved per sample.

| Device | Law | Parameters in registry |
|---|---|---|
| BJT | Ebers-Moll style exponential junctions | `saturationCurrent`, `forwardBeta`, `emissionCoefficient`, `pnp`, `darlingtonStages` |
| JFET | Square-law channel with pinch-off | to be documented |
| MOSFET | Square-law with threshold | **registry missing** |

Parasitic capacitance is modelled for BJT and JFET — fixed linear or charge-based
companion stamps — and stage-level Miller damping exists for Big Muff feedback-cap
behaviour.

Real-time compromises to write up:

- Multi-transistor stages push the Newton iteration cap hardest. A Big Muff has four.
- Compact laws drop the Gummel-Poon effects a full SPICE model carries. Which ones are audible.
- Bias drift with temperature is not simulated dynamically. For germanium that is a real omission.

**Available now:** 70 BJT entries and 20 JFET entries. Only 10% of the corpus's 385
transistors declare their saturation current, so most land on the silicon default —
and germanium sits five orders of magnitude away, worth 0.29 V of base-emitter bias.
Nothing infers germanium from a part number, deliberately.

**Gaps:** no MOSFET registry despite MOSFET being a named case in the device laws.
No provenance field on BJT or JFET entries. Germanium coverage is thin relative to
how much it matters.

## Visualization

- **Output characteristic family** — collector current against collector-emitter voltage, curve per base current, with a draggable bias point. This is the plot that makes bias legible.
- **Bias point overlaid on the load line**, so a mis-biased stage looks wrong rather than merely sounding wrong.
- **Parameter spread**, showing the min/typ/max beta band for a real part next to the single number a model usually uses.

## Audio simulation

- Same DI take, same Fuzz Face circuit, germanium against silicon.
- Bias swept live, from starved to centred, so the reader hears what bias *is*.
- Beta varied across its real spread on one part number, demonstrating why two pedals off the same bench differ.

## To do

- [ ] Split or keep as one article — decide once the JFET and MOSFET sections have real content
- [ ] Build the MOSFET registry, or state plainly that MOSFETs are unsupported
- [ ] Document the JFET and MOSFET laws as implemented
- [ ] Name the reference circuits (candidates: Fuzz Face for BJT, Big Muff for cascade)
- [ ] Add provenance to the 90 registry entries
