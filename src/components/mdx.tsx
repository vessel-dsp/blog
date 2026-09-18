import type { ComponentPropsWithoutRef } from "react";
import { AudioCompare } from "./figures/AudioCompare";
import { BufferSchematic } from "./figures/BufferSchematic";
import { Figure } from "./figures/Figure";
import { ImpedanceLadder } from "./figures/ImpedanceLadder";
import { PickupModel } from "./figures/PickupModel";
import { ResponseExplorer } from "./figures/ResponseExplorer";
import { SamplingWarp } from "./figures/SamplingWarp";

/**
 * The measure a line of body text is read at. Figures are deliberately wider than it:
 * the text column is set for reading, the figure column for looking.
 */
const COLUMN = "mx-auto max-w-[38rem]";

export const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 {...props} className={`${COLUMN} mt-16 mb-5 text-2xl sm:text-3xl`} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 {...props} className={`${COLUMN} mt-10 mb-3 text-xl`} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p {...props} className={`${COLUMN} my-5 text-[15px] sm:text-base`} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul {...props} className={`${COLUMN} my-5 list-disc pl-5 text-[15px]`} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol {...props} className={`${COLUMN} my-5 list-decimal pl-5 text-[15px]`} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li {...props} className="my-1.5" />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a {...props} className="link decoration-primary underline-offset-2" />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong {...props} className="font-semibold" />
  ),
  // A table is data, so it keeps the mono face and its own scroll container.
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="my-8 overflow-x-auto">
      <table
        {...props}
        className="w-full min-w-[560px] border-collapse font-[family-name:var(--font-mono)] text-[11px] uppercase"
      />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead {...props} className="border-base-content border-b" />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th
      {...props}
      className="px-2 py-2 text-left font-normal first:pl-0 [&:not(:first-child)]:text-right"
    />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td
      {...props}
      className="border-base-content/15 border-b px-2 py-2 first:pl-0 [&:not(:first-child)]:text-right"
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      {...props}
      className={`${COLUMN} my-8 border-primary border-l-2 pl-4 text-[15px]`}
    />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      {...props}
      className="bg-base-200 px-1 py-0.5 font-[family-name:var(--font-mono)] text-[0.85em]"
    />
  ),
  hr: () => <hr className={`${COLUMN} my-12 border-base-content/20`} />,

  // Figures available to any post.
  Figure,
  PickupModel,
  ResponseExplorer,
  AudioCompare,
  BufferSchematic,
  ImpedanceLadder,
  SamplingWarp,
};
