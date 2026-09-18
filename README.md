# blog (`apps/blog`)

The Vessel-DSPmarketing/content blog. Next.js App Router app, content-driven by
MDX files, sharing the brand theme via `@vessel-dsp/ui-theme`.

## Content

Posts live in `content/posts/*.mdx` with frontmatter:

```mdx
---
title: "Post title"
date: "2026-07-11"
excerpt: "One-line summary for the index."
author: "VesselDSP"
---

Body in MDX. You can embed React components (e.g. a future
`@vessel-dsp/player` "play this pedal" widget) by passing them to `<MDXRemote>`.
```

- `/` — post index (newest first), from `src/lib/posts.ts`.
- `/[slug]` — a post, rendered with `next-mdx-remote/rsc`. Statically generated
  via `generateStaticParams` (`dynamicParams = false`).

## Run

```bash
bun run --cwd apps/blog dev     # http://localhost:3000
bun run --cwd apps/blog build
```

## Follow-ups

- No CMS — content is in-repo. Add one only if editorial workflow needs it.
- Deployable standalone (blog.vesseldsp.com) or mount at vesseldsp.com/blog via
  `basePath` / rewrites.
- Wire real components into MDX (`components` prop on `<MDXRemote>`) once the
  player embed is available here.

See Linear **VDSP-44** and the `Vessel-DSPBlog` project.
