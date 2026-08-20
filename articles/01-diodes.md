---
title: Diodes
status: placeholder
tier: whitebox (MNA) / greybox (shaper)
devices_available: 63
---

# Diodes

> **Placeholder.** Structure and known facts only. Nothing here is measured yet.

## Introduction

A diode conducts one way and resists the other, and the transition between those
two states is not a corner — it is a curve. That curve is what a distortion pedal
sells.

Where they appear in pedals:

- **Feedback clippers** — inside an op-amp's feedback loop (Tube Screamer, Klon). Soft, compressed, the gain falls as the signal grows.
- **Output shunt clippers** — across the signal to ground (DS-1, Distortion+). Harder, flatter tops.
- **Rectifiers and detectors** — envelope followers, octave fuzzes, bias clamps.
- **Zener rail clamps** — power and bias protection, occasionally audible.

Why the model matters: swapping germanium for silicon moves the clipping onset by
hundreds of millivolts, which is many dB of headroom. Two diodes in series is not
one diode with more gain. An asymmetric pair adds even-order content a symmetric
pair does not.

## How to model it

The Shockley law, one equation:

```
I = Is · (exp(V / (n · Vt)) − 1)
```

| Symbol | Meaning | Where it comes from |
|---|---|---|
| `Is` | Saturation current | Derived from forward voltage at a 1 mA reference |
| `n` | Emission coefficient | Registry, per part |
| `Vt` | Thermal voltage | ~25.852 mV at 25 °C, scaled with temperature |

Two lanes exist in the engine:

- **Whitebox (MNA):** the diode is stamped into the matrix and solved per sample with Newton iteration. Terminal-accurate; the branch responds to whatever surrounds it.
- **Greybox (shaper):** a threshold/knee transfer curve. Stable and cheap, but it is not a terminal-level solve — the diode no longer interacts with its circuit.

Real-time compromises to write up:

- Newton iterations are capped per sample. An exponential that stiff will not always converge in budget — what happens then.
- `exp()` overflows in float32 long before the physics stops. Junction limiting is not optional.
- Clipping generates harmonics above Nyquist. Oversampling cost vs aliasing.

**Available now:** 63 entries in `component-diode-chips.json` — 27 zener, 11 silicon rectifier, 8 silicon switching, 5 germanium, 5 LED, 5 Schottky, plus placeholders to remove before publication.

**Gap:** these entries carry no provenance field. Copy the pattern from the triode registry, which cites datasheet and page per parameter.

## Visualization

- **I–V curve**, log current axis, several parts overlaid. The knee is the whole story and it is invisible on a linear axis.
- **Transfer curve** of the surrounding stage — input voltage against output voltage — because that, not the I–V, is what the ear hears.
- **Harmonic bars**, symmetric vs asymmetric pair, showing where even-order content comes from.

Interaction worth having: drag the drive level and watch the operating point move
along the curve. Clipping character is level-dependent, and a static plot hides that.

## Audio simulation

- One DI guitar take, every diode in the category, same circuit around it.
- A/B the same stage as whitebox MNA vs greybox shaper, with the CPU cost of each shown.
- Feedback clipper vs output shunt clipper, same diodes, so the topology difference is audible separately from the part difference.

## To do

- [ ] Name the reference circuit (candidate: TS808 feedback clipper — already in the corpus)
- [ ] Derive the law rather than quoting it
- [ ] State a measured error against a named reference
- [ ] Add provenance to the 63 registry entries
- [ ] Remove the `SOURCE-*` placeholder entries before anything ships
