import type { SVGProps } from "react";

/**
 * Vessel-DSPwordmark glyph. Uses `currentColor` -- set CSS `color` on this element
 * or a wrapper to theme it (see docs/ui/theme.md for the light/dark pattern).
 */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1024"
      height="1024"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VesselDSP"
      {...props}
    >
      <path
        d="M870.349 495.602C900.405 532.373 894.941 586.531 858.141 616.562L414.478 978.615C377.678 1008.65 323.482 1003.18 293.426 966.411L91.4016 719.248C61.3457 682.477 66.8146 628.319 103.616 598.288L168.492 545.336L356.669 775.557C386.725 812.329 440.926 817.793 477.727 787.762L856.497 478.654L870.349 495.602ZM610.522 45.386C647.323 15.3543 701.518 20.8188 731.574 57.5902L933.598 304.748C963.654 341.519 958.185 395.677 921.384 425.709L856.497 478.654L668.33 248.439C638.275 211.668 584.073 206.204 547.273 236.235L168.492 545.336L154.645 528.394C124.591 491.624 130.06 437.471 166.859 407.439L610.522 45.386Z"
        fill="currentColor"
      />
    </svg>
  );
}
