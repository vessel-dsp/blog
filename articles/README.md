# Lessons

One device class per article. Every article has the same four sections:

| Section | Answers |
|---|---|
| **Introduction** | What the device is, where it shows up in pedals, why its model matters to what you hear |
| **How to model it** | The constitutive law, the parameters, the tier it belongs in, what gets dropped for real-time |
| **Visualization** | The curve or surface that makes the behaviour legible, and what to look at on it |
| **Audio simulation** | Hear it. Same source signal, parts swapped, tradeoff moved by the reader |

## Order

Sequenced by modeling difficulty, not by importance — each article assumes the one before it.

| # | Article | Device class | Status |
|---|---|---|---|
| 01 | [Diodes](01-diodes.md) | Silicon, germanium, Schottky, LED, zener | placeholder |
| 02 | [Op-amps](02-op-amps.md) | Macro-modelled gain blocks | placeholder |
| 03 | [Transistors](03-transistors.md) | BJT, JFET, MOSFET | **draft — engine reviewed 2026-08-20** |
| 04 | [Tubes](04-tubes.md) | Triodes, power tubes, rectifiers | placeholder |

Diodes come first because a diode is the smallest complete nonlinearity: one equation, two terminals, and it already forces every hard decision — iteration, damping, oversampling. Tubes come last because they need all of it plus a fitted 2D surface.

## The bar

Placeholders may be thin. A published article may not. Before an article loses its
placeholder status it needs:

1. A named real circuit it appears in.
2. The law derived, not asserted.
3. A measurement with the error stated as a number, against a named reference.
4. The reference named honestly — SPICE agreement is not hardware agreement.
5. The real-time compromise stated, with what it costs.
