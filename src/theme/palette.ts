/**
 * Pedal/amp color -> section-background palette injection.
 * Reference implementation from docs/ui/colors.md -- keep in sync with that doc.
 */

export type Band = "vivid" | "pastel";

const BAND_LIGHTNESS: Record<Band, number> = { vivid: 70, pastel: 85 };
const SECONDARY_BLACK = "#1d1d1d";
const WHITE = "#ffffff";
const DARK_SOURCE_LUMINANCE_THRESHOLD = 0.18;

export function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return [h * 60, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`.toUpperCase();
}

/** WCAG 2.x relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const r = toLinear(Number.parseInt(hex.slice(1, 3), 16) / 255);
  const g = toLinear(Number.parseInt(hex.slice(3, 5), 16) / 255);
  const b = toLinear(Number.parseInt(hex.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(l1: number, l2: number): number {
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickContrastFont(backgroundHex: string): string {
  const bgLum = relativeLuminance(backgroundHex);
  const vsWhite = contrastRatio(bgLum, relativeLuminance(WHITE));
  const vsBlack = contrastRatio(bgLum, relativeLuminance(SECONDARY_BLACK));
  return vsWhite > vsBlack ? WHITE : SECONDARY_BLACK;
}

export function paletteInject(sourceHex: string, band: Band, saturation = 95): string {
  const [h] = hexToHsl(sourceHex);
  return hslToHex(h, saturation, BAND_LIGHTNESS[band]);
}

export interface SectionTheme {
  background: string;
  font: string;
  isDarkSource: boolean;
}

/**
 * Given a pedal/amp's own color, derive a section background + readable font color.
 * See docs/ui/colors.md for the full algorithm and worked examples.
 */
export function sectionTheme(sourceHex: string, band: Band = "pastel"): SectionTheme {
  const isDarkSource = relativeLuminance(sourceHex) < DARK_SOURCE_LUMINANCE_THRESHOLD;

  let background: string;
  if (isDarkSource) {
    background =
      relativeLuminance(sourceHex) < relativeLuminance(SECONDARY_BLACK)
        ? SECONDARY_BLACK
        : sourceHex.toUpperCase();
  } else {
    background = paletteInject(sourceHex, band);
  }

  return { background, font: pickContrastFont(background), isDarkSource };
}
