---
title: Tubes
status: placeholder
tier: whitebox (compact MNA) + oracle table
devices_available: 19 (9 triode, 7 power tube, 3 rectifier)
---

# Tubes

> **Placeholder.** Structure and known facts only. Nothing here is measured yet.

Last article in the sequence because a tube needs everything the previous three
established, plus a fitted surface and a warning label.

## Introduction

A triode is a valve: a grid voltage throttles a current from cathode to plate. It
distorts asymmetrically, it compresses, it sags when the power supply cannot keep
up, and it is the reason amp modeling is harder than pedal modeling.

Where they appear: the amp, not the pedal — preamp stages (12AX7 and relatives),
power stages, and rectifiers. A handful of pedals run starved-plate triodes at
low voltage, which behave nothing like the same tube at 300 V.

Why the model matters: the tube stage is where "sounds like a modeler" comes from.
The nonlinearity is not a clip, it is a curved gain that changes with signal level
and with what the power supply is doing at that instant.

**Safety:** real tube circuits run at 250–800 V DC, which is lethal. Any article
that mentions bench measurement carries that warning prominently, the way
Amperatubes does.

## How to model it

Two cooperating pieces:

- **Compact MNA law** — a Koren-style parameterization stamped into the matrix, plus grid current, grid leak conductance, and interelectrode capacitance for Miller effect.
- **Oracle table** — a fitted 2D surface, generated offline by `scripts/oracle-accuracy/triode-table.ts`, then carried into the runtime container. This is the compromise the article is about: the physics is solved offline, and the real-time path interpolates it.

Koren parameters in the registry: `korenMu`, `korenKg1`, `korenKp`, `korenKvb`,
`korenEx`, alongside `mu`, `transconductance`, `exponent`, `gridCurrentScale`, and
three interelectrode capacitances.

**This registry is the provenance template.** Every fitted parameter cites its
source — e.g. the 12AX7 Koren values are a train/holdout refit against the RCA
12AX7-A average plate characteristics chart, page 3, and the 1.7 pF grid-plate
capacitance cites RCA, Brimar, and Tesla ECC83 datasheets agreeing. Rows also carry
a `terminalProfileEvidenceStatus` naming what is still open. The other four device
classes should look like this.

Real-time compromises to write up:

- Table interpolation instead of solving the device law per sample. Where does the table's grid resolution become audible.
- Supply sag is modelled as rail-RC dynamics with a rectifier sag surface, not a full power-supply solve.
- Transformer and output-stage fidelity is model-limited, and the docs say so: amps are validated by stage-law gates plus a NAM capture cross-check, never a full-circuit SPICE deck.

**Available now:** 9 triode entries (12AX7, ECC83, 7025, 12AT7, ECC81, 12AU7, ECC82,
12AY7, 12AV7), 7 power tubes, 3 rectifiers.

**Gap:** 19 tubes is a demonstration, not a database. Amperatubes lists 339. Tube
data is datasheet-derivable, so this gap closes with curve-fitting work rather than
bench work — the pipeline already exists in `scripts/check-tube-curves.ts`.

## Visualization

- **Plate characteristic curves** with a draggable operating point and load line. This is table stakes; Amperatubes has it and it is the single most legible tube visualization there is.
- **Fit quality overlay** — the fitted Koren surface against the datasheet points it was fit to, with residuals. Nobody publishes this, and it is the honest version of the same plot.
- **Table resolution artifacts** — the interpolated surface against the continuous law, showing what the real-time compromise actually costs.

## Audio simulation

- Same DI take through a preamp stage at datasheet voltage and starved.
- Supply sag on and off, on material with hard transients, where sag is what you hear.
- Solved law against interpolated table, A/B, with the CPU cost of each shown.

## To do

- [ ] Decide scope: preamp triode only for v1, or power stage and rectifier too
- [ ] Expand beyond 9 triodes using the existing curve-fit pipeline
- [ ] Publish the fit residuals — the differentiating visualization
- [ ] Add the high-voltage safety warning to any bench-measurement content
- [ ] State the amp-lane claim boundary up front: stage-law gates plus NAM cross-check, not full-circuit SPICE
