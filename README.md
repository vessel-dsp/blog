# Modeling

The physical device modeling companion for guitar pedals — a device database, interactive modeling tools, and lessons on how a circuit becomes code you can play through.

Published at [modeling.vessel-dsp.com](https://modeling.vessel-dsp.com). Part of [VesselDSP](https://vessel-dsp.com).

## The rule

> **Realism first, compromised to real-time.**

Every modeling decision here is judged against two numbers, in this order:

1. **Realism** — does it match the measured device? Not "does it sound good," does it *match*.
2. **Latency** — does it run inside one audio buffer, every buffer, on the target hardware?

A model that is accurate but late is a plugin nobody plays. A model that is fast but wrong is a fuzz pedal pretending to be a Tube Screamer. The craft is in what you give up, and in what order.

## What this is

Three layers, in order of how hard they are to copy:

### 1. Device database (the asset)

Every device a pedal builder actually solders, with the numbers needed to model it:

- Measured parameters (not datasheet-typical — measured, with the sample size)
- Which modeling tier it belongs in, and why
- The model itself: equations, coefficients, and code
- An audio demo, so you can hear the difference between two parts before you buy either

Starting with clipping diodes, because that is the most-argued-about component in pedal DIY and the one where the models diverge most audibly.

### 2. Interactive tools (the hook)

Static curves are what everyone else has. These run the actual real-time engine in your browser:

- **Clipping explorer** — swap the diode, drag the bias, hear it change on your own guitar signal
- **Transfer curve viewer** — the nonlinearity, live, next to its audible result
- **Tier comparator** — the same stage as whitebox / greybox / blackbox, A/B switchable, with the CPU cost of each shown
- **Aliasing meter** — see what your oversampling choice is actually costing you

Every tool is a demonstration of the rule: realism on one axis, latency on the other, and you can move the tradeoff yourself.

### 3. Lessons (the funnel)

One mechanism per lesson. Every lesson must have:

1. **A real circuit** — named pedal or amp stage, with schematic reference.
2. **The mechanism** — the physics, derived, not asserted.
3. **Runnable code** — small enough to read in one sitting.
4. **A measurement** — model output vs. real device, with the error stated as a number.
5. **The compromise** — what was given up to hit real-time, and what it costs you.

A lesson without #4 and #5 is a blog post, not a lesson.

Planned:

| # | Lesson |
|---|---|
| 01 | Realism vs. latency: how to choose a tier |
| 02 | From schematic to state: nodal analysis in one pass |
| 03 | The nonlinear element: why one diode breaks your solver |
| 04 | Oversampling, aliasing, and the cost of being right |
| 05 | Measuring your model against the real pedal |

## The three tiers

Every technique here names a tier, because the tradeoff is different in each:

- **Whitebox** — circuit-level (MNA). Full component fidelity, highest cost.
- **Greybox** — microblocks. Known circuit stages, hand-derived, cheap.
- **Blackbox** — neural capture (NAM, [ConeTracer](https://github.com/vessel-dsp/ConeTracer)). Matches one configuration exactly, generalizes to none.

Real pedals get modeled with all three at once. Knowing which stage deserves which tier *is* the skill.

## Why physical modeling

Most pedal software is either a static EQ curve or a black-box neural capture. Physical modeling sits between them: you model the *device*, so the model responds to what you do to it — knob positions, input level, supply voltage, component swaps — the way the real circuit does. Capture a diode clipper once and you get one sound. Model it and you get every diode.

## Contributing

Corrections to the physics and the measurements are the most valuable contribution. If an entry's numbers do not reproduce on your bench, open an issue with your measurement and your setup.

## License

Prose and data: CC BY 4.0. Code: MIT.
