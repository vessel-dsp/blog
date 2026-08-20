---
title: Transistors
status: draft
sections: introduction / how to model it / visualization / audio simulation
---

# Transistors

Three devices share one slot in a circuit, and almost nothing else about them is the
same. This article is about what a transistor actually does, what a circuit simulator
does instead, and how wide the gap between those two is.

The gap is the whole subject. Every audio simulation of a transistor is an
approximation — there is no version where it isn't — so the useful question is never
"is this accurate?" but "which approximation is this, and what did it drop?"

---

## Introduction

**BJT — current-controlled.** The fuzz device. Fuzz Face, Tone Bender, Big Muff,
Rangemaster. Germanium versus silicon is not a subtle swap here: the two differ in
saturation current by about five orders of magnitude, which is roughly 0.3 V of
base-emitter bias, and germanium's leakage is large enough to set the operating point
by itself.

**JFET — voltage-controlled, depletion mode.** Conducts with no gate bias and pinches
off as the gate goes negative, so its threshold is *negative*. Used to imitate tube
stages and as an analogue switch. Its part-to-part spread is famously wide — a
datasheet transconductance range spanning two orders of magnitude is normal.

**MOSFET — voltage-controlled, enhancement mode.** Off at zero bias, so its threshold
is *positive*. Insulated gate, so no DC gate current at all. Clipping element, boost
stage, CMOS-inverter analogue stage.

Why any of this matters to what you hear: a transistor stage's **bias point** determines
almost everything audible about it, and bias is exactly what a careless model gets
wrong. A Fuzz Face biased right and a Fuzz Face biased wrong are different pedals, not
the same pedal with a different knob setting.

---

## How to model it

### The ceiling: what the device really is

The physically honest description of a transistor is not an equation, it is a
boundary-value problem. Carrier transport through doped semiconductor is governed by
Poisson's equation coupled to the electron and hole continuity equations:

```
∇·(ε∇ψ) = −q(p − n + N_D − N_A)
∂n/∂t = (1/q)∇·J_n + G − R
∂p/∂t = −(1/q)∇·J_p + G − R
```

Solving that means meshing the actual physical device in two or three dimensions and
stepping the mesh through time, with carrier statistics, generation and recombination,
field-dependent mobility, doping profiles, and self-heating. This is what TCAD does, and
it is the closest thing to ground truth a simulator can reach.

It is also completely unusable for audio. A single transient of a single transistor is
minutes to hours of compute. A four-transistor fuzz at 44.1 kHz needs 44,100 solved
circuit states *per second of audio*, and each of those needs several nonlinear
iterations over the whole circuit.

So the first thing to understand about transistor modeling is that **the ideal
simulation is not merely expensive, it is off by ten or more orders of magnitude.**
Everything below is a chain of deliberate retreats from it.

### What MNA actually does

Circuit simulators do not solve device physics. They solve a network.

**Modified Nodal Analysis** writes Kirchhoff's current law at every node. For a circuit
of *n* nodes that is *n* equations in *n* unknown node voltages, assembled as a matrix.
Each component "stamps" its contribution:

- A resistor of conductance `G` between nodes `a` and `b` adds `+G` at `(a,a)` and
  `(b,b)` and `−G` at `(a,b)` and `(b,a)`. That is the entire resistor.
- A voltage source cannot be written as a current, so MNA adds an extra unknown for its
  branch current and an extra row — the "modified" in the name.
- A capacitor is not an algebraic element at all. It becomes a **companion model**: a
  conductance plus a current source whose values depend on the timestep and the
  capacitor's previous state. Trapezoidal integration gives `G = 2C/Δt`; backward Euler
  gives `C/Δt`. The choice of integration rule is a modeling decision with audible
  consequences, and the companion conductance scales with sample rate.

Everything linear is now one matrix solve. The transistors are the problem.

### Nonlinear devices: Newton-Raphson and companion models

A transistor's current is an exponential or a square law of its terminal voltages, so it
cannot be stamped as a constant. The standard answer is to linearise it about a guess
and iterate:

1. Guess the node voltages.
2. For each nonlinear device, evaluate its current at the guess and its derivatives
   (`gm`, `gds`, `gπ`, …) — the local slopes.
3. Stamp those slopes as conductances, plus a current source correcting for the
   difference between the linear approximation and the true current.
4. Solve the matrix. Get a new guess.
5. Repeat until the change between iterations falls below tolerance.

That is Newton-Raphson applied to the whole circuit at once, and the "companion model"
is just the tangent line to the device's characteristic at the current guess.

**It does not converge on its own.** An exponential's derivative grows as fast as the
exponential, so an early guess that is 0.2 V too high produces a correction hundreds of
times too large, which produces a worse guess. Real simulators need help:

- **Junction limiting** — clamp how far a junction voltage may move per iteration. This
  is not optional; without it high-gain circuits simply never converge.
- **gmin stepping** — add a tiny conductance across every junction, solve, then shrink it
  toward zero. Keeps the matrix non-singular when everything is cut off.
- **Source stepping** — ramp the supplies up from zero, using each solution as the seed
  for the next.
- **Pseudo-transient** — solve a fictitious transient to steady state instead of solving
  DC directly.

Limiting has its own failure mode, and it is worth knowing about because it is
counter-intuitive: a limiter can clamp an iterate to the *same value* twice in a row.
The iteration is then simultaneously stationary and flagged as damped — a converged
answer that the convergence test refuses to accept, because "was limited" usually means
"is not converged". Circuits can stall there for every sample of a render while the
underlying numbers are already correct.

### Compact models: the retreat, in rungs

Between "one exponential" and "mesh the silicon" there is a well-worn ladder. Each rung
adds physics and costs both parameters and time.

| Rung | BJT | FET | What it buys |
|---|---|---|---|
| 0 | static transfer curve | static transfer curve | Nothing electrical. A waveshaper cannot load its source or interact with its circuit. |
| 1 | ideal switch / fixed Vbe drop | ideal switch | Topology only. Bias is wrong, so tone is wrong. |
| 2 | **Ebers-Moll** (Is, βf, βr) | **Shichman-Hodges** (Vth, β, λ) | Correct bias and correct large-signal shape. The workhorse. |
| 3 | **Gummel-Poon** | MOS level 2/3 | Beta rolloff at high current (knee) and low current (recombination), Early effect, junction capacitances, base resistance modulation. Level- and frequency-dependence become right. |
| 4 | **VBIC / HICUM / MEXTRAM** | **BSIM** | Self-heating, avalanche, distributed and quasi-saturation effects. Dozens to hundreds of parameters. |
| 5 | drift-diffusion TCAD | drift-diffusion TCAD | The physics. Unusable in a circuit loop. |
| — | **a real transistor on a bench** | — | Above every rung: a specific specimen, at a specific temperature, in a specific layout, with its own stray capacitance. |

Ebers-Moll in transport form is three parameters and two exponentials:

```
Ift = Is · (exp(Vbe / Vt) − 1)
Irt = Is · (exp(Vbc / Vt) − 1)

Ic  = Ift − Irt · (1 + 1/βr)
Ib  = Ift/βf + Irt/βr
```

Shichman-Hodges is the FET counterpart, one square law in two regions:

```
cutoff       drive = Vgs − Vth ≤ 0   →  I = 0
triode       Vds < drive             →  I = β·Vds·(2·drive − Vds)·(1 + λ·Vds)
saturation   Vds ≥ drive             →  I = β·drive²·(1 + λ·Vds)
```

For guitar circuits, rung 2 is usually enough to get the *character* right and rung 3 is
where the *detail* lives. Rung 4 and above buy things that matter for RF and IC design
and almost nothing a guitarist can hear — with one exception, self-heating, which is
audible in germanium.

### Where realism actually leaks

Knowing the rungs is not the same as knowing which omission you will hear. Six leaks,
roughly in order of audible cost:

1. **Bias, not waveform.** Get the saturation current wrong by the germanium-to-silicon
   distance and base-emitter turn-on moves by about 0.3 V. A germanium bias network
   evaluated with silicon parameters never turns on at all, and the stage renders near
   silence. This is the single largest error mode in transistor modeling, and it is a
   *parameter* error, not a *model* error.
2. **Level, not shape.** Correlation against a reference is easy to score well on;
   matching gain is much harder. A model can reproduce the waveform faithfully and still
   be 10 dB off, and correlation cannot see that at all, because scaling a signal does
   not change its shape.
3. **Reverse conduction.** A FET channel is symmetric — with the gate on, current flows
   drain-to-source and source-to-drain equally well, which is exactly why a JFET works
   as an analogue switch. Treating negative Vds as cutoff is an easy mistake to make and
   an expensive one, because an audio signal spends half of every cycle there.
   Simulators handle it by swapping the two terminals and evaluating the forward law at
   the swapped operating point.
4. **Temperature.** Germanium leakage current flows out through the base bias resistor
   and therefore *sets* the operating point. Model the leakage and thermal drift comes
   for free; omit it and germanium behaves like silicon with a lower turn-on.
5. **Part-to-part spread.** A datasheet gain range of 100 to 300 is not a modeling
   footnote — it is the reason two pedals built from the same schematic sound different.
   A model that uses the typical value describes a transistor that does not exist.
6. **Aliasing.** Any nonlinearity generates harmonics above the Nyquist frequency. At a
   fixed audio-rate timestep those fold back down as inharmonic content. This is a
   *sampling* artefact with no analogue in the physical device, and it is the one error
   on this list that gets worse the harder you drive the circuit.

### The real-time compromise

Offline simulation and real-time simulation are the same mathematics under opposite
constraints.

| | Offline SPICE | Real-time audio |
|---|---|---|
| Timestep | Adaptive, microseconds down to nanoseconds, controlled by local truncation error | **Fixed** — one audio sample, ~22.7 µs at 44.1 kHz |
| Iterations | Iterate until convergence, effectively unbounded | **Bounded** — must finish this sample before the next one is due |
| Precision | double | often single |
| Failure mode | takes longer, or reports non-convergence | **audible dropout** |

The fixed timestep is the deep one. Offline, a simulator detects a fast switching edge
and shrinks its step by three orders of magnitude to resolve it. Real-time cannot: the
step is the sample period, always, whether the circuit is idling or slamming into
saturation. Every fast edge is therefore under-resolved by construction.

Given that, there are only three levers, and each one trades against the others:

- **Fewer iterations.** Cheap, and the error shows up as a lagging or smeared
  nonlinearity — worst on transients, exactly where the ear is most sensitive.
- **Simpler model.** Drop from rung 3 to rung 2. Cheap and predictable, and what you
  lose is level- and frequency-dependent detail rather than gross character.
- **Oversampling.** Run the solve at 2×, 4× or 8× rate. Directly attacks aliasing and
  partially restores edge resolution, at linear cost in CPU plus filter latency.

Realism, then, is not a single number. It is a position on the rung ladder, plus a
statement of which of the six leaks you have plugged, plus the sample rate you did it
at. Any claim of accuracy that does not say all three is not saying much.

### A note on what "verified" means

It is common to validate a real-time model against an offline SPICE simulation, and that
is worth doing — SPICE is reproducible, well understood, and far more accurate than any
real-time solver. But it is a *reference*, not ground truth. Both simulators sit on the
same rung ladder, and both are below the bench.

Agreement with SPICE is necessary evidence. Only agreement with a measured device is
proof, and that requires a specific specimen at a specific temperature — which brings
leak 5 back around, because the specimen you measure is not the specimen in the
listener's pedal.

---

## Visualization

Four plots that make the above legible, in the order they teach best.

1. **Output characteristic family with a draggable load line.** Ic against Vce, one curve
   per base current, with the bias point where the load line crosses. Move the bias
   resistor and watch the point slide from starved to centred to saturated. This is the
   plot that makes bias a *thing you can see* rather than a number in a netlist.
2. **Newton-Raphson walking to a solution.** The device I–V curve, the load line, and the
   tangent lines the solver actually constructs, iteration by iteration. Then turn the
   limiter off and watch it fly off the chart. This is the best available explanation of
   why convergence aids exist.
3. **The reverse quadrant, drawn.** Most textbook FET plots stop at Vds = 0. Extending
   the axis into negative Vds — and showing the terminal swap that produces the mirrored
   curve — makes leak 3 obvious in one picture.
4. **Parameter spread as a band, not a line.** Plot the min/typ/max gain envelope a real
   part occupies, with the single typical-value curve inside it. The band is the honest
   picture; the line is what models use.

---

## Audio simulation

One guitar take, held constant across every comparison, so the only variable is the
model.

1. **Germanium against silicon** in the same fuzz circuit — then germanium again with the
   leakage term zeroed, so the leak is audible as its own contribution rather than as
   part of a part swap.
2. **Bias swept live**, starved to centred. Bias is the least visual and most audible
   parameter a transistor stage has, and hearing the sweep teaches more than any plot.
3. **Rung 2 against rung 3** on the same circuit — Ebers-Moll against Gummel-Poon — with
   the CPU cost of each shown. This is the tradeoff of the whole article, made audible.
4. **Reverse conduction on and off.** A ten-times level error is not a subtlety, and
   hearing it makes the case for terminal-level modeling better than any correlation
   score.
5. **Oversampling off, 2×, 8×** on a hard-driven stage, so aliasing is heard as the
   inharmonic grit it is rather than described.

---

## Where the models come from

The compact models above are not folklore; they have papers, and reading them is the
fastest way past this article.

- J. J. Ebers and J. L. Moll, "Large-Signal Behavior of Junction Transistors,"
  *Proceedings of the IRE*, 1954.
- H. K. Gummel and H. C. Poon, "An Integral Charge Control Model of Bipolar
  Transistors," *Bell System Technical Journal*, 1970.
- H. Shichman and D. A. Hodges, "Modeling and Simulation of Insulated-Gate
  Field-Effect Transistor Switching Circuits," *IEEE Journal of Solid-State Circuits*,
  1968.
- C.-W. Ho, A. E. Ruehli and P. A. Brennan, "The Modified Nodal Approach to Network
  Analysis," *IEEE Transactions on Circuits and Systems*, 1975.
- L. W. Nagel, "SPICE2: A Computer Program to Simulate Semiconductor Circuits,"
  UC Berkeley memorandum ERL-M520, 1975. The convergence-aid chapters are still the
  clearest writing on the subject.
