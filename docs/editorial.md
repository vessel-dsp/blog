# Editorial

One mechanism per post. Two formats, one bar.

## Frontmatter

Every post in `content/posts/` carries the same block, whether it is `.md` or `.mdx`:

```yaml
---
title: "Buffer"
date: "2026-09-15"          # first publication; edits don't change it
excerpt: "One sentence, used on the index and in cards."
author: "VesselDSP"
format: "visual"            # article | visual
status: "draft"             # placeholder | draft | published
---
```

`src/lib/posts.ts` reads these and defaults anything missing — `format` to `article`,
`status` to `published` — so a malformed post ships silently. Check the index page after
adding one.

`status` is public, and shown on the post. A placeholder is structure only; a draft is
honest but incomplete; `published` means it clears the bar below.

## The two formats

### `format: article`

Markdown, prose carrying the explanation and figures supporting it. The default — choose
it unless the post genuinely cannot be told in words.

### `format: visual`

Infographic-like. Figures, curves, annotated schematics and audio carry the explanation;
the prose is captions and connective tissue. These are `.mdx`, so they can use the figure
components in `src/components/figures/`.

Rules a visual post has to clear:

1. **The figures carry it.** Delete the prose and the post still teaches. If deleting the
   figures leaves a post that still teaches, it is an `article`, not a `visual`.
2. **Every figure states its takeaway** in its own caption — that is why `<Figure>` makes
   `takeaway` a required prop. A reader who scrolls and reads nothing but captions gets
   the argument.
3. **Animation only for time.** Animate when the thing being shown *is* a change over
   time. Never as decoration, never as the only way to reach a fact.
4. **Legible at phone width.** The site is a single light theme, so there is no dark
   variant to check — but a figure wider than a phone belongs in its own scroll
   container, which `<Figure>` provides. The page body must never scroll sideways.
5. **No colour-only encoding**, and a text alternative on every figure: `role="img"` plus
   an `aria-label` that states the numbers, not just the shape.
6. **Numbers on the axes.** An infographic with unlabelled axes is a poster.
7. **Units keep their own case.** Pass `caps={false}` to `<Tag>` for anything carrying a
   unit. The brand's uppercase turns `1 µF` into `1 ΜF` — a capital Greek mu, which reads
   as one megafarad. This has already happened once.

## Figures are measurements

A curve in a post is data the engine produced, not a shape drawn to illustrate a point.
`scripts/measure-buffer-response.ts` is the pattern: compile the `.vdsp` circuits, sweep
them through the runtime, write JSON into `src/data/`, and let the figure plot that.

If a figure shows a model rather than a measurement — the interactive one does, because it
has to recompute as you drag — it says so on the figure, and the measured series is
overlaid wherever the two can be compared.

## The bar

A post may be a draft in public. It may not be wrong. Before `status: published`:

1. **A named real circuit** — a pedal or amp stage the mechanism actually appears in.
2. **The mechanism derived**, not asserted.
3. **An error stated as a number**, against a named reference.
4. **The reference named honestly** — SPICE agreement is not hardware agreement, and the
   post says which one it has.
5. **The real-time compromise stated**, with what it costs.

Point 4 is the one that gets skipped everywhere else. The engine is validated against
ngspice, not against a bench; posts inherit that ceiling and say so in their own words.

## Current posts

| Post | Format | Status |
|---|---|---|
| [Buffer](../content/posts/buffer.mdx) | visual | draft |
