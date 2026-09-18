import type { ComponentPropsWithoutRef } from "react";

/**
 * Consistent text label for form controls. Render it as the descriptor next to an
 * input/select/checkbox (inside a `<label>` wrapper, or standalone) so every field
 * label shares one style instead of ad-hoc `<span className="text-xs">` usages.
 */
export function Label({ className = "", ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={`text-xs font-normal ${className}`.trim()} {...props} />;
}
