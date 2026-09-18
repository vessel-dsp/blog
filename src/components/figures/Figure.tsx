import type { ReactNode } from "react";

/**
 * The frame every figure in a visual post sits in.
 *
 * The caption is required and carries the takeaway, because the editorial rule for a
 * visual post is that a reader who reads nothing but captions still gets the argument
 * (docs/editorial.md). A figure whose caption only names it fails that on its own.
 */
export function Figure({
  n,
  label,
  takeaway,
  children,
}: {
  n: number;
  label: string;
  takeaway: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="my-12 border border-base-content/90">
      <div className="flex items-stretch border-b border-base-content/90">
        <div className="flex items-center bg-base-content px-3 py-2 text-base-100 text-xs">
          FIG {String(n).padStart(2, "0")}
        </div>
        <div className="flex items-center px-3 py-2 text-xs">{label}</div>
      </div>
      <div className="overflow-x-auto px-3 py-4 sm:px-5">{children}</div>
      <figcaption className="border-base-content/20 border-t px-3 py-3 text-[11px] leading-relaxed sm:px-5">
        {takeaway}
      </figcaption>
    </figure>
  );
}
