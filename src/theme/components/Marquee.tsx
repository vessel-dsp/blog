import type { CSSProperties, ReactNode } from "react";

export interface MarqueeProps {
  /** Content to scroll. It is duplicated once for a seamless loop. */
  children: ReactNode;
  /** Seconds for one full loop (lower = faster). */
  duration?: number;
  /** Gap between the repeated content groups. */
  gap?: string;
  /** Scroll right-to-left (default) or left-to-right when true. */
  reverse?: boolean;
  className?: string;
}

/**
 * Horizontal marquee that scrolls its children and pauses on hover. The content is
 * rendered twice so the loop is seamless; the duplicate is hidden from assistive tech.
 * Animation is CSS-only (see `.marquee` in theme.css) and respects reduced-motion.
 */
export function Marquee({
  children,
  duration = 20,
  gap = "2rem",
  reverse = false,
  className = "",
}: MarqueeProps) {
  return (
    <div
      className={`marquee ${className}`.trim()}
      data-reverse={reverse}
      style={{ "--marquee-duration": `${duration}s`, "--marquee-gap": gap } as CSSProperties}
    >
      <div className="marquee__group">{children}</div>
      <div className="marquee__group" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
