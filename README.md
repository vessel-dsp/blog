# Modeling

Lessons on **physical device modeling** for guitar pedals and amps — how a circuit becomes code you can play through.

Published at [modeling.vessel-dsp.com](https://modeling.vessel-dsp.com). Part of [VesselDSP](https://vessel-dsp.com).

## The rule

> **Realism first, compromised to real-time.**

Every modeling decision in these lessons is judged against two numbers, in this order:

1. **Realism** — does it match the measured device? Not "does it sound good," does it *match*.
2. **Latency** — does it run inside one audio buffer, every buffer, on the target hardware?

A model that is accurate but late is a plugin nobody plays. A model that is fast but wrong is a fuzz pedal pretending to be a Tube Screamer. The craft is in what you give up, and in what order.

## Why physical modeling

Most pedal software is either a static EQ curve or a black-box neural capture. Physical modeling sits between them: you model the *device*, so the model responds to what you do to it — knob positions, input level, supply voltage, component swaps — the way the real circuit does. Capture a diode clipper once and you get one sound. Model it and you get every diode.

## The lessons

Each lesson is one mechanism, from a real circuit, with runnable code and a measurement you can reproduce.

| # | Lesson | Status |
|---|---|---|
| 01 | Realism vs. latency: how to choose | planned |
| 02 | From schematic to state: nodal analysis in one pass | planned |
| 03 | The nonlinear element: why a diode breaks your solver | planned |
| 04 | Oversampling, aliasing, and the cost of being right | planned |
| 05 | Measuring your model against the real pedal | planned |

## The three tiers

These lessons name a tier for every technique, because the tradeoff is different in each:

- **Whitebox** — circuit-level (MNA). Full component fidelity, highest cost.
- **Greybox** — microblocks. Known circuit stages, hand-derived, cheap.
- **Blackbox** — neural capture (NAM, ConeTracer). Matches one configuration exactly, generalizes to none.

Real pedals get modeled with all three at once. Knowing which stage deserves which tier *is* the skill.

## Contributing

Corrections to the physics and the measurements are the most valuable contribution. If a lesson's claim does not reproduce on your bench, open an issue with your measurement.

## License

Prose: CC BY 4.0. Code: MIT.
