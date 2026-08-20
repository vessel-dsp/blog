---
title: Op-amps
status: placeholder
tier: greybox (macro model)
devices_available: 39
---

# Op-amps

> **Placeholder.** Structure and known facts only. Nothing here is measured yet.

## Introduction

An op-amp has dozens of transistors inside it, and almost none of them matter to
what you hear. This is the article about when *not* to model the circuit.

Where they appear in pedals: the gain stage of nearly every overdrive and EQ built
after 1975 — Tube Screamer, Klon, DOD 250, Boss GE-7, Rat.

Why the model matters: builders argue about op-amp swaps more than almost any
other part, and the differences that are real come from a short list — slew rate,
supply headroom, and how the part behaves when it runs out of rail. An ideal op-amp
model erases exactly those.

## How to model it

Not stamped as transistors. Modelled as a macro block with four parameters:

| Parameter | What it changes audibly |
|---|---|
| Open-loop gain (`Aol`) | How closely the loop holds; matters little until the loop opens |
| Gain-bandwidth product (`GBP`) | Where the stage stops keeping up; sets the dominant pole at `GBP / Aol` |
| Slew rate | Behaviour on transients — the one parameter builders can actually hear |
| Saturation voltage | Where the output hits the rail, and how the clip sounds |

Engine defaults when the source states nothing: `Aol = 1e5`, `GBP = 1 MHz`,
slew 1 V/µs. These are fallbacks, not descriptions — the write-up should say so
and say how often they get used.

Real-time compromises to write up:

- Clipping at the rail is currently a threshold/knee shaper with ADAA (first-order antiderivative antialiasing), not a device-level solve.
- Deterministic clip-threshold jitter is applied, so the ceiling is not a perfectly fixed number.
- The input stage's own nonlinearity is not modelled. Where does that stop being true.

**Available now:** 39 entries in `component-opamp-chips.json`, alias-rich — the LM741 row alone covers 11 part names. Includes the parts people argue about: JRC4558D, RC4558, NJM4558, JRC4580D, LM308, LM301.

**Gap:** no provenance field, and no statement of which parameter differences are audible at pedal signal levels. That second one is the whole point of the article.

## Visualization

- **Slew-limited step response**, several parts overlaid, at pedal signal levels rather than datasheet test levels.
- **Open-loop gain vs frequency**, showing the dominant pole and where the loop gives up.
- **Clipping onset** as the rail is approached, comparing symmetric supply against the 9 V single-supply reality of a pedal.

Interaction worth having: swap the op-amp in a fixed circuit and see which curves
move and which do not. Most do not. That is the finding.

## Audio simulation

- Same DI take, same TS-style circuit, op-amp swapped. Blind A/B, because this is the claim most in need of a blind test.
- Transient-heavy source material, where slew rate should be audible if it ever is.
- Drive pushed until the stage hits the rail, where saturation voltage separates the parts.

## To do

- [ ] Name the reference circuit (candidate: TS808 gain stage)
- [ ] State honestly whether the op-amp swap is audible in this circuit, with numbers
- [ ] Document how often the class defaults are hit rather than real parameters
- [ ] Add provenance to the 39 registry entries
