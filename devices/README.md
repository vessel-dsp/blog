# Device database

One file per device. Every entry needs:

| Field | Rule |
|---|---|
| Identity | Part number, package, typical source, rough price |
| Measured params | Measured on real samples, with sample count and test conditions. Datasheet values allowed only when labelled as such. |
| Tier | Whitebox / greybox / blackbox, with the reason |
| Model | Equations + coefficients + reference implementation |
| Cost | CPU cost of the model at 48 kHz, and the oversampling it needs |
| Demo | Audio, same source signal across every device in the category |

The "same source signal" rule is what makes the database comparable. One DI guitar take, every device, forever.

## Categories

- `diodes/` — silicon, germanium, Schottky, LED, MOSFET-as-diode
- `opamps/` — slew rate, rails, and where the model stops mattering
- `transistors/` — BJT, JFET, MOSFET
- `magnetics/` — transformers, inductors, pickup loading
- `tubes/` — later; the amp stage, not the pedal stage
