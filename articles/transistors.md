---
title: Transistors
status: draft — reviewed against the engine, not yet measurement-backed
reviewed: 2026-08-20
source: workbench v2 compiler + runtime
tier: whitebox (compact MNA)
---

# Transistors

Three devices share one slot in a circuit, and almost nothing else about them is the
same. This article covers how all three are actually modelled — not how they could be.

Everything below was read out of the v2 compiler (`src/compiler/`) and runtime
(`src/runtime/reference-runtime.ts`, `src/dsp/WhiteBoxEngine.cpp`) on 2026-08-20.
Where the engine does something incomplete, this says so.

---

## Introduction

**BJT — current-controlled.** The fuzz device. Fuzz Face, Tone Bender, Big Muff,
Rangemaster. Germanium versus silicon here is not a subtle swap: leakage and
temperature drift are part of the sound, and germanium's saturation current sits
about five orders of magnitude from silicon's.

**JFET — voltage-controlled, depletion mode.** Conducts with no gate bias and pinches
off as the gate goes negative, so its threshold is *negative*. Used to imitate tube
stages and as an analogue switch. J201 and 2N5457 are the pedal staples, and their
part-to-part spread is famously wide — the registry puts 2N5457's β between
2.78 × 10⁻⁵ and 2.0 × 10⁻², a factor of 720.

**MOSFET — voltage-controlled, enhancement mode.** Off at zero bias, so its threshold
is *positive*. Clipping element, boost stage, CMOS-inverter analogue stage.

Why the model matters: a transistor stage's bias point determines almost everything
audible about it, and bias is exactly what a careless model gets wrong. A Fuzz Face
biased right and a Fuzz Face biased wrong are different pedals.

---

## How to model it

### The BJT: Ebers-Moll, transport form

The runtime linearises about the previous Newton iterate. Forward and reverse
transport currents:

```
Ift = Is · (exp(Vbe / Vt) − 1)
Irt = Is · (exp(Vbc / Vt) − 1)

Ic  = Ift − Irt · (1 + 1/βr) − Ileak
Ib  = Ift/βf + Irt/βr + Ileak
```

PNP is handled by negating both junction voltages rather than by a second code path,
so there is one model and one sign convention.

**Germanium leakage is the same shape, not a new mechanism.** Ebers-Moll already has a
reverse current — about 1 nA at the saturation currents these packets declare — but a
real germanium part leaks 100 to 1000 times that. So the model adds a larger prefactor
on the same `exp(Vbc/Vt) − 1` term: zero at zero bias, saturating at `−Ileak` under
reverse bias, exactly as a junction does. It touches base and collector only, because
collector-base leakage is measured with the emitter open.

That detail is the reason germanium fuzz drifts with temperature: **the leakage current
flows out through the base bias resistor and sets the operating point.** Model the
leakage and you get the drift for free. Omit it and you get a germanium pedal that
behaves like a silicon one.

**Darlingtons get one trick instead of two transistors.** A Darlington's external Vbe is
the sum of two junction drops (~1.3 V) and its effective β is the product of two
internal βs. Rather than stamping two devices, the engine multiplies the thermal voltage
by `darlingtonStages`, so the same Ic requires `stages × Vbe_single`. One registry part
uses it: MPSA13.

### The FET: Shichman-Hodges, both channels, both directions

```
cutoff       drive = Vgs − Vth ≤ 0   →  I = 0, gds = 1e-12
triode       Vds < drive             →  I = β·Vds·(2·drive − Vds)·(1 + λ·Vds)
saturation   Vds ≥ drive             →  I = β·drive²·(1 + λ·Vds)
```

A p-channel device is the same equations with every voltage negated — again one model,
not a mirrored copy.

**A channel conducts both ways, and the engine used to get this wrong.** An earlier
version treated `Vds < 0` as cutoff, so a FET with its drain below its source was fully
off. A real channel is symmetric: with the gate on, current flows source-to-drain just
as happily — which is precisely why a JFET works as an analogue switch. The fix follows
ngspice's MOS level 1 and swaps the two terminals, evaluating the forward law at
`(Vgs − Vds, −Vds)` and negating its current. By the chain rule that gives
`gm' = −gm` and `gds' = gm + gds`.

The cost of getting it wrong was not subtle, because an audio signal spends half its
cycle there. On `boss-hm-2`, three of four FETs sat at negative Vds with positive
overdrive for **900, 1503 and 1831 of 2400 samples**, all three in the signal path.
The runtime opened them while ngspice passed signal: **corr = 0.5448, gain = 0.238** —
ten times too quiet. It was the corpus's last parity disagreement, found only after
window, timestep, op-amp knee, self-oscillation and the diode clamp had each been ruled
out.

### Two implementations, and they are not the same fidelity

This is the thing most likely to surprise someone reading the code for the first time.

| | TS `reference-runtime.ts` | C++ `WhiteBoxEngine.cpp` |
|---|---|---|
| BJT law | Ebers-Moll transport | Ebers-Moll **plus** knee currents, recombination currents, forward and reverse Early voltage |
| Junction capacitance | none | Cbe/Cbc with junction potential, grading, forward-bias coefficient; fixed-linear or charge-based mode |
| Noise | none | per-junction shot noise with its own PRNG state |
| Specimen drift | none | `specimenThermalDriftAmount` / `specimenThermalState` |
| JFET vs MOSFET | **one law** (`kind: "fet"`) | **two structs** — `MnaJfet` (gate junctions, gate capacitances, shot noise) and `MnaMosfet` (insulated gate, no DC gate current) |

The TypeScript path is the reference candidate measured against the ngspice oracle. The
C++ path is what ships in the browser. The shipping path is the *richer* one — so a
parity number measured against the reference runtime is a floor, not a description of
what a listener hears.

### What real-time costs

| Constraint | Value | Where it bites |
|---|---|---|
| Timestep | fixed, 1 audio sample (~22.7 µs @ 44.1 kHz) | no adaptive refinement through a switching edge |
| Newton iterations | hard cap ≤ 24/sample, typically 1–8 | multi-transistor stages; a Big Muff has four |
| Precision | float32 in WASM | `exp()` is clamped at an argument of 60 |
| Matrix size | ≤ 48 unknowns per loaded program | caps how much circuit can surround the transistors |

**Junction limiting is not optional.** Three limiters exist — `limitJunction` for BJT
junctions, `limitFetGate`, and `limitFetDrain` — because an undamped exponential
overshoots and never returns.

And limiting has its own failure mode, which is worth an article of its own. The drain
limiter is applied *only in conduction*, because clamping below cutoff deadlocks the
solve outright: `limitFetDrain`'s lower branch is `max(next, −0.5)`, so once history
reaches −0.5 and the true drain is below it, the clamp returns −0.5 forever. The iterate
is then **stationary and flagged limited at the same time**, and the convergence rule
bars a limited iterate by construction. `boss-ge-7` held **95,988 of 96,000 samples** on
exactly that, reporting `delta = 1.175e-16, limited = true` — a converged answer,
refused. ngspice solves the same circuit to 9.410 × 10⁻² RMS.

### Where the parity currently lands

Transistor-heavy circuits are the loosest tier in the whole corpus:

| Circuit class | correlation | normalised RMS | gain ratio |
|---|---|---|---|
| Aggressive nonlinear (big-muff-pi) | > 0.90 | < 0.45 | up to 1.75 |
| High-gain fuzz / multi-BJT (ds-1, ts808) | > 0.92 | < 0.55 | ≥ 0.45 |
| Bias-starved / extreme drive | > 0.4–0.8 | < 0.65–0.80 | wide |

The weakest axis is **level, not shape**. Correlation stays high while the gain ratio
band stays wide. And the reference is ngspice, not hardware — SPICE agreement is
necessary evidence, never proof of a real-device match.

---

## Visualization

1. **Output characteristic family with a draggable bias point.** Ic against Vce, one
   curve per base current, load line overlaid. This is the plot that makes bias legible:
   a mis-biased stage should *look* wrong before it sounds wrong.
2. **The reverse quadrant, drawn.** Most textbook FET plots stop at Vds = 0. Drawing
   the negative-Vds half — and showing the terminal swap that produces it — is the
   visualization of the `boss-hm-2` bug, and nobody else publishes it.
3. **Parameter spread as a band, not a line.** 2N5457's β min/typ/max spans a factor of
   720; BC549's β spans 100–300. Show the band the real part occupies next to the single
   number the model uses. This is why two pedals off the same bench differ.
4. **Germanium leakage against temperature**, with the bias point moving as a
   consequence. The mechanism, not just the symptom.

---

## Audio simulation

One DI guitar take, held constant across every comparison.

1. **Germanium against silicon** in a Fuzz Face, with leakage modelled and then zeroed —
   so the reader hears what the leakage term is actually worth.
2. **Bias swept live**, from starved to centred. Bias is the least visual and most
   audible parameter a transistor stage has.
3. **β varied across its real registry spread** on one part number, demonstrating
   part-to-part variation as an audible fact rather than a forum claim.
4. **Reverse conduction on and off** — the `boss-hm-2` bug as an A/B. A ten-times level
   error is not a subtlety, and hearing it makes the case for terminal-level modelling
   better than any correlation number.

---

## What the review found

Five gaps, in the order they should be fixed.

### 1. JFET and MOSFET source parameters are discarded

`netlist.ts` has a `bjt` block that reads SPICE model cards — `Type`/`Polarity`, `IS`,
`BF`, `BR`, `LeakageCurrent` — into device parameters. **There is no `jfet` or `mosfet`
block.** So every FET in the v2 corpus reaches `device-laws.ts` with no parameters and
takes the class defaults: `thresholdVolts = ∓2`, `transconductance = 1e-3`.

Verified in the generated catalog: every `"kind":"fet"` stamp in
`generated-v2-packet-catalog.ts` reads
`{"channelLengthModulation":0,"thresholdVolts":-2,"transconductance":0.001}`. Every
JFET in the shipped v2 catalog is the same generic device.

This is the identical bug that BJTs had and that was already fixed. That fix is
documented with its cost: before it, all **385** corpus transistors were stamped as one
silicon NPN with β = 100 and IS = 1e-14, though **43 declare `Type: PNP`** and 17 more
declare `Polarity` with no `Type`. On `sola-sound-tone-bender-professional-mkii`, Q1 is
a germanium PNP declaring IS = 1 nA, BF = 70, BR = 2: `Vbe = Vt·ln(Ic/Is)` at 1 mA is
**0.345 V declared against 0.633 V at the silicon default**, so a germanium bias network
modelled as silicon never reaches turn-on and the pedal renders near-silence.

The FET version of that story has not been written yet, because the FET version of that
fix has not happened.

### 2. Channel-length modulation is thrown away

`device-laws.ts` hardcodes `channelLengthModulation: 0` for both JFET and MOSFET. The
runtime implements λ correctly in both the triode and saturation branches, and the
registry *has the data* — 2N5457 carries `lambda: 0.003`. The parameter is measured,
plumbed at both ends, and zeroed in the middle.

### 3. The v2 compiler cannot see the registries at all

`src/compiler/` and `src/runtime/` contain no reference to any
`web/assets/registry/component-*-chips.json`. The registries are read only by
`src/web/` — the CircuitDocument part-profile layer and the playback catalog. So the
20 JFET rows and 70 BJT rows are real data that the v2 law resolver never consults; it
is fed by packet properties or nothing.

### 4. JFET and MOSFET collapse to one law in the compiler

`device-laws.ts` emits `kind: "fet"` for both, differing only in the sign of the default
threshold. The C++ engine keeps them distinct — `MnaJfet` has gate junctions,
gate-source/gate-drain capacitances and shot noise; `MnaMosfet` is insulated-gate with
no DC gate current. A MOSFET routed through the TypeScript path loses the distinction
that defines it.

There is also no `component-mosfet-chips.json`, so MOSFETs have no registry rows at all.

### 5. Doc drift

`docs/audio-simulation-realism/transistor-modeling-fidelity.md` links
`web/assets/registry/microblock-bjt-chips.json`. The file is
`component-bjt-chips.json`.

---

## Registry inventory

| Class | File | Rows | Notable |
|---|---|---|---|
| BJT | `component-bjt-chips.json` | 70 | 27 PNP, 7 germanium (AC128, OC44, OC75, 2G381, 2N2614, OC71, 2N404A), 5 with leakage, 1 Darlington (MPSA13) |
| JFET | `component-jfet-chips.json` | 20 | J201, 2N5457, MPF102, 2SK30A…; carries `beta`, `thresholdVoltageMagnitude`, `lambda` |
| MOSFET | — | 0 | law exists, registry does not |

**Provenance lives one layer up.** The JSON registries carry bare numbers, but
`.agents/skills/guitar-pedals/profiles/bjts.yaml` and `jfets.yaml` carry `status`,
`usedIn` (which pedal, in what role), `terminalBehaviorNeeded`, `validation`
requirements, and `sources.chipNotes` pointing at per-part notes. Any public device page
should render from the YAML profile layer, not from the stripped JSON.

---

## To do before this stops being a draft

- [ ] State a measured error for one named transistor circuit, against a named reference
- [ ] Decide whether the honest claim is per-part or per-family, given gap 1
- [ ] Get one real JFET part's parameters through the compiler end to end (2N5457 or J201)
- [ ] Confirm whether the C++ engine's Early voltage and knee currents are populated in shipped programs or left at their zero defaults
- [ ] Pick the reference circuits: Fuzz Face (germanium BJT), Big Muff (cascade), a JFET boost
