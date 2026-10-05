import localFont from "next/font/local";

/** Self-hosted so production builds do not download Google Fonts. */
export const display = localFont({
  src: "../fonts/fraunces-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: "Times New Roman",
});

export const displayItalic = localFont({
  src: "../fonts/fraunces-italic-latin.woff2",
  weight: "500",
  style: "italic",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const script = localFont({
  src: "../fonts/caveat-latin.woff2",
  weight: "500",
  display: "swap",
});
