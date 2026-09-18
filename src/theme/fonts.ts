import { Space_Grotesk, Space_Mono } from "next/font/google";

/**
 * Wordmark + body copy, per docs/ui/theme.md.
 */
export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Headers (h1-h6), per docs/ui/theme.md.
 */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});
