---
title: Op-amps
status: draft
sections: introduction / how to model it / visualization / audio simulation
---

# Op-amps

An op-amp contains twenty to forty transistors and almost none of them matter to what
you hear. This is the article about when *not* to model the circuit — and about the one
device where the idealised model is not an error but a legitimate rung on the ladder.

That inversion is the interesting part. With a discrete transistor, simplifying the model
breaks the bias and therefore the tone. With an op-amp, simplifying is nearly free for
most of what the part does, and expensive for exactly one thing: what happens when it
runs out of supply.

---

## Introduction

An operational amplifier is a differential gain block wrapped in feedback. Left alone it
has enormous gain, no useful accuracy, and no defined output; wrapped in a feedback
network it becomes whatever that network says it is — a gain stage, a filter, an
integrator, a summing node.

Where they appear in pedals: the gain stage of nearly every overdrive and EQ built after
about 1975. Feedback-clipping overdrives, op-amp fuzzes, active tone stacks, buffers,
and the bias-splitting rail that makes single-supply operation possible.

Why the model matters, and where it doesn't: builders argue about op-amp swaps more than
almost any other component. Some of those differences are real and some are not, and the
line between them is drawn by *topology* rather than by the part. This article's goal is
to make you able to predict which side of that line a given circuit sits on.

The one thing that always matters: a pedal op-amp runs on a **9 V single supply**, often
less after a dying battery, with the signal biased to roughly half of it. That is a
headroom of a few volts peak-to-peak. Almost every audible op-amp behaviour in a pedal is
a consequence of that constraint rather than of the part's datasheet excellence.

---

## How to model it

### The ceiling: an op-amp is a circuit, not a device

There is no constitutive law for an op-amp. Unlike a diode or a transistor, it is not a
physical junction with an equation — it is a schematic, and the honest model is that
schematic: an input differential pair, a current-mirror load, a gain stage with a
compensation capacitor, an output stage with bias and short-circuit protection.

So the realism ceiling is one rung *higher* than for a discrete part. To model an op-amp
perfectly you must model its twenty-plus transistors, each of which has its own ceiling
of drift-diffusion device physics beneath it. Manufacturer transistor-level netlists
exist for many parts and are the closest practical thing to ground truth.

They are also thousands of times more expensive than the circuit around them, and for
audio they are almost always the wrong choice. The whole art here is knowing how far
down the ladder you can retreat before the retreat becomes audible.

### What MNA actually does with one

The idealised op-amp is not a device at all. It is a **constraint**.

An ideal op-amp in feedback forces its two inputs to the same voltage, drawing no input
current, and produces whatever output that requires. In nodal terms that is a
*nullor* — a nullator at the input (V₊ − V₋ = 0, I = 0) and a norator at the output (any
voltage, any current). It contributes one equation and one extra unknown for the output
branch current, exactly like a voltage source, and it is *linear*.

The consequences are worth dwelling on:

- **The ideal op-amp is cheaper than a resistor network.** It adds one row and one
  column to the matrix and no nonlinearity at all. A circuit built entirely of ideal
  op-amps, resistors and capacitors is one linear solve per sample, forever.
- **It is also better conditioned** than the finite-gain alternative. The common
  finite-gain formulation stamps a voltage-controlled voltage source with gain `Aol` —
  and a gain of 10⁵ or 10⁶ puts a very large number in the matrix, which is exactly what
  a solver's precision does not like.
- **And it removes every behaviour a pedal is built around.** An ideal op-amp has
  infinite output swing, so it never clips; infinite bandwidth, so it never lags;
  infinite slew, so it never smears a transient.

That is the trade in one paragraph: the cheapest and most numerically stable op-amp model
is also the one that erases the reason distortion pedals use op-amps.

### How SPICE actually does it

SPICE has **no op-amp primitive**. Its device list is resistors, capacitors, inductors,
sources, diodes, BJTs, JFETs, MOSFETs, the four controlled sources, and `.SUBCKT`. Every
op-amp model is a subcircuit assembled from those, so "how SPICE models an op-amp"
really means "which subcircuit did the model's author choose." Four levels are in common
use.

**One controlled source.** A voltage-controlled voltage source is a complete op-amp
model:

```spice
E1 out 0 inp inm 1e6
```

Infinite bandwidth, infinite swing, no input current. Rung 0–1, and it is what a great
deal of filter simulation actually uses.

**A controlled source plus an RC.** Add a pole and you have a gain-bandwidth product:

```spice
E1  1   0  inp inm  1e6      ; gain
R1  1   2  1k                ; RC sets the dominant pole
C1  2   0  159n              ; f_p = 1/(2*pi*R1*C1)
E2  out 0  2   0    1        ; buffer
```

Still linear, still never clips. Rung 2.

**The Boyle macromodel.** This is what people mean by "the SPICE op-amp model," and the
classic 741 subcircuit is built this way. Three stages:

- *Input stage* — an actual differential pair of BJTs with a tail current source. Real
  transistors, not a controlled source. This is the clever choice, because input bias
  current, offset voltage and the differential pair's own nonlinear transfer all come
  for free, as does the mechanism for slew limiting.
- *Gain stage* — a controlled source feeding a high-impedance node with the Miller
  compensation capacitor across it. The dominant pole lives here.
- *Output stage* — a controlled source, an output resistance, and **diodes clamping to
  the supply rails**.

Two behaviours *emerge* from that topology rather than being typed in as parameters, and
both matter for real-time work:

1. **Slew rate is not a parameter.** The tail current can only charge the compensation
   capacitor so fast, so `SR = I_tail / C_comp`. Bandwidth and slew rate are therefore
   *coupled* in the model exactly as they are in silicon — you cannot adjust one without
   moving the other.
2. **The clip has an exponential knee, not a corner**, because the limit is enforced by
   diodes rather than by a hard rail. This is worth dwelling on: the smoothed knee a
   real-time solver adopts for convergence reasons is not purely a numerical fudge. The
   reference it gets compared against also has a soft knee, for physical reasons.

Boyle's real contribution was a **fitting procedure**: the element values are computed
from datasheet numbers — open-loop gain, gain-bandwidth product, slew rate, offset
voltage, bias current, CMRR, output resistance, short-circuit current. A Boyle model is a
curve-fit to a datasheet, not an extraction from a die. Two parts with identical
datasheets get identical models.

**Manufacturer and behavioral models.** Some vendors publish transistor-level netlists of
the actual die; most ship a Boyle-style or proprietary macromodel instead. Simulators
also offer behavioral routes — a level-switched universal op-amp, XSPICE code models, or
nonlinear dependent sources used to write a limiting function directly.

What none of the common models capture well: recovery from saturation (so the sputter on
note decay is missing from the reference too), 1/f noise, CMRR and PSRR versus frequency,
and temperature.

### The rung ladder

| Rung | Model | What it buys | What it costs |
|---|---|---|---|
| 0 | **Ideal**: V₊ = V₋, infinite gain, bandwidth, slew, swing | Correct closed-loop gain; correct filter response. For a clean buffer or an EQ operated below clipping, this is *right*, not approximate. | Nothing. Linear. |
| 1 | + finite open-loop gain `Aol` | Loop error — the small gain inaccuracy of a real stage | A very large matrix entry |
| 2 | + dominant pole (`GBP`) | Loop gain falls with frequency, so the stage stops keeping up at the top end | One state variable |
| 3 | + **output saturation at the rails** | **Clipping.** For pedals this is the single most important rung on the ladder. | Nonlinearity — now the solve iterates |
| 4 | + slew-rate limiting | Transient behaviour under large fast signals | State plus a rate limiter |
| 5 | + input-stage nonlinearity, bias and offset current, CMRR/PSRR, output impedance, current limit, noise | Everything else on the datasheet | Many parameters, most inaudible |
| 6 | manufacturer transistor-level netlist | Everything the part actually does | Thousands of times the circuit's own cost |
| 7 | drift-diffusion TCAD per transistor | The physics | Unusable |
| — | **the actual chip on a bench** | — | Above every rung: one specimen, one temperature, one supply |

The shape of this ladder is the opposite of the transistor ladder. There, rung 2 was the
minimum for correct behaviour. Here, **rung 0 is correct for a large class of circuits,
and rung 3 is where nearly all the audible content lives.** Rungs 4 and 5 are where most
of the folklore lives, and folklore and audibility are not the same thing.

### Saturation is a numerical problem, not just a modeling one

Adding rails looks like a one-line change and is not. A hard clip — output follows the
input until it hits a limit, then stops — has a **discontinuous derivative** at the
limit. Newton-Raphson works by following derivatives, so at a hard corner it will
overshoot, come back, overshoot again, and refuse to settle.

Three standard answers, all of which are modeling decisions with audible consequences:

- **Smooth the knee.** Replace the corner with a `tanh`, a polynomial, or a soft-limiting
  function whose derivative is continuous. Converges beautifully. Slightly wrong on the
  approach to the rail, which is audible as a softer clip than the real part.
- **Model the output stage** so the limit emerges from device physics instead of being
  imposed. Correct, and much more expensive.
- **Clamp with limiting** and accept a bounded iteration count, as with any stiff
  nonlinearity.

And once the output clips, harmonics appear above the Nyquist frequency. In the common
case where clipping is treated as a memoryless function of the input, **antiderivative
antialiasing** applies: instead of evaluating the nonlinearity at a point, integrate it
across the sample interval analytically. First-order ADAA costs one extra evaluation and
one state variable and removes most of the aliasing, which is one of the better
cost-to-benefit ratios available anywhere in audio DSP.

### Where realism actually leaks

Six leaks, ranked by how much of the audible difference they account for.

1. **Rails, not gain.** A 9 V supply with the signal biased at 4.5 V gives a few volts of
   swing. Everything about how a pedal op-amp sounds when pushed is a property of that
   ceiling: where it is, how abruptly the part meets it, and what the output does on the
   way back. This is rung 3, and it dwarfs the rest of the list.
2. **What clips first, and it is usually not the op-amp.** In a feedback-clipping
   overdrive, diodes in the feedback loop conduct long before the op-amp reaches its
   rails — so the op-amp's own saturation is never exercised and modeling it in detail
   buys nothing. In a hard-driven booster with no clipping diodes, the op-amp *is* the
   clipper and rung 3 is everything. **Same part, opposite conclusion, decided entirely
   by topology.** This is the single most useful idea in this article.
3. **Slew rate, and the arithmetic that settles the argument.** A sine of amplitude `A`
   at frequency `f` has a maximum slope of `2πfA`. For a 4 V peak output at 5 kHz that is
   about **0.13 V/µs**. A famously slow op-amp manages 0.5 V/µs; ordinary ones manage 5
   to 20. So slew limiting on a guitar signal at pedal levels requires either far more
   swing than a 9 V rail permits or far more high-frequency energy than a guitar
   produces. Slew rate is real, it is measurable, and in most pedal circuits it is not
   the thing being heard. Do the multiplication before believing the forum.
4. **Recovery from saturation.** Driving an op-amp hard into a rail can push its internal
   stages out of their normal operating region, and coming back is not instantaneous.
   The audible result is sputtering or gating on note decay. This is a rung-5-and-above
   effect that *is* sometimes audible, which makes it the most interesting entry on the
   list.
5. **Output impedance and current limit.** Irrelevant driving a 1 MΩ input; relevant
   driving a long cable, a low-impedance load, or a passive tone stack that loads the
   stage hard.
6. **Noise.** Input-referred noise voltage matters in high-gain stages, where it is
   amplified by everything downstream. In a unity-gain buffer it is inaudible.

Note what is absent from this list: open-loop gain. The difference between 10⁵ and
2 × 10⁵ changes the closed-loop gain of a typical pedal stage by a fraction of a
percent. It is the parameter most often quoted and among the least audible.

### The real-time compromise

| | Offline SPICE | Real-time audio |
|---|---|---|
| Op-amp model | Manufacturer macromodel or full netlist | Rung 0–4, chosen per circuit |
| Timestep | Adaptive; shrinks through a clipping edge | **Fixed** — one audio sample |
| Iterations | Until convergence | **Bounded** |
| Clipping edges | Resolved | Under-resolved by construction; aliasing follows |

The fixed timestep hurts op-amps in a specific way. Clipping is a fast event, and offline
simulators respond by taking much smaller steps through it. A real-time solver cannot, so
its clipping edge is always resolved at the sample period — which is precisely why
antialiasing treatment is not a refinement here but a requirement.

The levers, in the order they usually pay off:

- **Choose the rung by topology, not by ambition.** Rung 0 for a buffer, rung 3 for a
  clipper. Modeling slew rate in a circuit where the diodes clip first is pure cost.
- **Antialias the clipping.** First-order ADAA or oversampling. Cheapest large win.
- **Smooth the knee** enough for the solver to converge in budget, and know that you have
  traded a slightly softer clip for that convergence.

### A note on what "verified" means

Comparing a real-time op-amp model against an offline SPICE run using the manufacturer's
macromodel is good practice and worth doing. It is also comparing two models to each
other, and the section above says concretely what the other one is: a datasheet fit with
a diode-shaped clip, a slew rate that is a side effect of two element values, and no
saturation-recovery mechanism at all.

Agreement with SPICE is necessary evidence. Only a bench measurement of a real chip on a
real supply is proof, and even then it is proof about one specimen.

---

## Visualization

Four plots, in the order they teach best.

1. **Open-loop and closed-loop gain on one Bode plot.** Open-loop gain rolling off from
   its dominant pole, the closed-loop gain flat until it meets that roll-off, and the
   vertical distance between them — the loop gain — shrinking to nothing. Everything
   rungs 1 and 2 buy is visible in that shrinking gap.
2. **The rails as a box the signal lives in.** Output swing plotted against supply
   voltage, with a guitar signal drawn inside it at increasing drive, running out of room.
   Then drop the supply from 9 V to 7 V and watch the box shrink. This is the article's
   main point in one picture.
3. **The slew-rate argument, plotted.** Required slew rate `2πfA` against frequency for a
   few realistic output swings, with real parts' slew rates drawn as horizontal lines.
   The reader can see for themselves where the lines cross and whether a guitar ever gets
   there.
4. **Stage transfer curve at increasing drive**, with the clipping source labelled — diode
   conduction versus rail saturation. Run it for a feedback clipper and a bare booster
   side by side. Leak 2, made visual.

---

## Audio simulation

One guitar take, held constant, so the only variable is the model.

1. **Rung 0 against rung 3** — ideal op-amp against rails modelled — in a hard-driven
   booster. This is the largest single audible step on the whole ladder, and hearing it
   first sets the scale for everything after.
2. **The same op-amp swap in two circuits**: a feedback clipper and a bare booster. Same
   two parts, same signal. The prediction is that the swap is inaudible in one and obvious
   in the other. Publishing the result either way is the point.
3. **Slew rate reduced deliberately** until it becomes audible, and report the value it
   took. That number, compared against real parts' datasheets, settles leak 3 for good.
4. **Hard clip, smoothed knee, and antialiased clip** on the same driven stage, so the
   difference between a modeling choice and a sampling artefact is audible as two separate
   things.
5. **Supply sagged from 9 V toward 7 V** while playing. Headroom is the op-amp's dominant
   audible parameter, and nothing demonstrates that faster than taking it away.

---

## Where the models come from

- G. R. Boyle, B. M. Cohn, D. O. Pederson and J. E. Solomon, "Macromodeling of
  Integrated Circuit Operational Amplifiers," *IEEE Journal of Solid-State Circuits*,
  1974. The origin of the op-amp macromodel that SPICE-family simulators still use.
- J. E. Solomon, "The Monolithic Op Amp: A Tutorial Study," *IEEE Journal of Solid-State
  Circuits*, 1974. Still the clearest explanation of why the internal topology is what it
  is.
- P. R. Gray, P. J. Hurst, S. H. Lewis and R. G. Meyer, *Analysis and Design of Analog
  Integrated Circuits*. The textbook for what is inside the package.
- W. Jung (ed.), *Op Amp Applications Handbook*, Analog Devices, 2005. Practical
  treatment of the non-ideal parameters, including recovery behaviour.
- J. D. Parker, V. Zavalishin and E. Le Bivic, "Reducing the Aliasing of Nonlinear
  Waveshaping Using Continuous-Time Convolution," *Proc. DAFx*, 2016. The antiderivative
  antialiasing method.
