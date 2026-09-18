# Site architecture

Next.js 16 App Router, statically exported at build, deployed to `blog.vesseldsp.com`.
The stack deliberately matches the `website` monorepo's, because this repo used to be
`website/apps/blog` and was moved out to stand on its own.

## Why this stack

Two kinds of post, one site:

- Simple text posts stay **plain markdown**. Writing one should not mean touching a
  component.
- Visual posts are **content- and animation-rich**: generated figures, live controls,
  audio. Markdown cannot express them.

`content/posts/*.md` and `*.mdx` cover both. `next-mdx-remote/rsc` renders them with the
component map in `src/components/mdx.tsx`, so an `.mdx` post can use any figure component
while a `.md` post needs nothing but frontmatter.

## The vendored theme

`src/theme/` is a **copy** of `@vessel-dsp/ui-theme` from the website monorepo
(`packages/ui-theme/src/`). This repo is standalone and that package is a private
workspace dependency, so it is vendored rather than installed.

`tsconfig.json` maps `@vessel-dsp/ui-theme` → `src/theme`, so imports read exactly as they
do in the monorepo and re-syncing is a copy with no rewrites:

```bash
cp -r ../website/packages/ui-theme/src/. src/theme/
```

Keep edits upstream. A change made only here is drift, not a fix — the one intended
difference is the header comment in `src/theme/theme.css` saying so.

The theme is **light only** (`color-scheme: light`, `prefersdark: false`), so figures have
one palette to satisfy, not two. Body type is Space Mono in uppercase; long-form reading
opts out via `.prose-reading`, which the post layout applies.

## Where the numbers come from

Figures plot engine measurements, not drawings:

1. Circuits live in `content/circuits/*.vdsp` — the same interchange format the rest of
   VesselDSP uses.
2. `scripts/measure-buffer-response.ts` compiles them with the audio-engine compiler,
   sweeps them through the reference runtime, and writes `src/data/*.json`.
3. Figures import that JSON.

The script needs the `workbench` checkout beside this repo, since the compiler and runtime
are not published packages. That is a real coupling and the reason the JSON is committed:
the site builds without the engine, and only regenerating the data needs it.

Audio is rendered the same way — offline, through the engine — and committed as mp3 under
`public/audio/`.

## Planned: live playback

`@vessel-dsp/player` on `@vessel-dsp/runtime` will play a `.vdsp` file in the page. When
it lands, `AudioCompare` becomes an embed of that player pointed at the same
`content/circuits/*.vdsp` files, and the pre-rendered mp3s become the fallback rather than
the source. The circuits are already the right artifact to hand it; nothing about the
content model needs to change.

## Open

- Deployment target is not set up yet. Static output, so any host works.
- The DI guitar take used in the Buffer post comes from the audio-engine test assets.
  **Its licence has not been checked**, and a public blog redistributes it — resolve
  before publishing, or re-record a take we own.
