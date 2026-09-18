"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { contrastRatio, relativeLuminance } from "../palette";
import { Logo } from "./Logo";

// There is no global dark mode in this system -- section backgrounds vary per content
// (see sectionTheme in palette.ts). The navbar is transparent and reads the *rendered*
// background behind it only to flip its foreground the way pickContrastFont() does:
// white on dark surfaces, brand black on light ones.
const WHITE_LUMINANCE = relativeLuminance("#ffffff");
const BLACK_LUMINANCE = relativeLuminance("#1d1d1d");

/** Parse a CSS `rgb()`/`rgba()` string into [r, g, b, a]; null if not a color. */
function parseColor(input: string): [number, number, number, number] | null {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const nums = match[1]
    .split(/[\s,/]+/)
    .map(Number.parseFloat)
    .filter((n) => !Number.isNaN(n));
  if (nums.length < 3) return null;
  const [r, g, b, a = 1] = nums;
  return [r, g, b, a];
}

/** WCAG relative luminance from 8-bit RGB channels (mirrors palette.relativeLuminance). */
function rgbLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Find the first opaque background color behind the navbar and decide whether it is
 * a "dark mode" surface (white foreground wins the contrast comparison).
 */
function resolveIsDark(navbar: HTMLElement): boolean {
  const rect = navbar.getBoundingClientRect();
  const x = Math.round(rect.left + rect.width / 2);
  const y = Math.round(rect.top + rect.height / 2);

  let bgLuminance: number | null = null;
  const stack =
    typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(x, y) : [];
  for (const el of stack) {
    // Skip the navbar itself and its own children -- we want what's *behind* it.
    if (navbar.contains(el)) continue;
    const color = parseColor(getComputedStyle(el).backgroundColor);
    if (color && color[3] > 0) {
      bgLuminance = rgbLuminance(color[0], color[1], color[2]);
      break;
    }
  }

  if (bgLuminance === null) {
    const bodyColor = parseColor(getComputedStyle(document.body).backgroundColor);
    bgLuminance =
      bodyColor && bodyColor[3] > 0
        ? rgbLuminance(bodyColor[0], bodyColor[1], bodyColor[2])
        : WHITE_LUMINANCE;
  }

  return contrastRatio(bgLuminance, WHITE_LUMINANCE) > contrastRatio(bgLuminance, BLACK_LUMINANCE);
}

export interface NavbarProps {
  /** Wordmark shown next to the logo. */
  wordmark?: string;
  /** Href for the brand link. */
  href?: string;
  /** Extra classes for the outer `<nav>` (e.g. positioning like `sticky top-0`). */
  className?: string;
  /** Right-aligned content (links, buttons, etc.). */
  children?: ReactNode;
}

/**
 * Global navbar: transparent bar with the logo + wordmark on the left and optional
 * `children` on the right. Stays transparent and flips the logo + text white when the
 * section rendered behind it is dark, since this system has no global dark mode toggle.
 */
export function Navbar({
  wordmark = "Vessel-DSP",
  href = "/",
  className = "",
  children,
}: NavbarProps) {
  const ref = useRef<HTMLElement>(null);
  const [isDark, setIsDark] = useState(false);

  const update = useCallback(() => {
    if (ref.current) setIsDark(resolveIsDark(ref.current));
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return (
    <nav
      ref={ref}
      data-mode={isDark ? "dark" : "light"}
      className={`navbar transition-colors ${isDark ? "text-white" : "text-secondary"} ${className}`.trim()}
    >
      <a href={href} className="flex items-center gap-2">
        <Logo className="h-8 w-8" aria-hidden="true" />
        <span>{wordmark}</span>
      </a>
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </nav>
  );
}
