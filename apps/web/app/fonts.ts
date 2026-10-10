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

export const text = localFont({
  src: [
    { path: "../fonts/AderoTrial-Light.otf", weight: "300", style: "normal" },
    { path: "../fonts/AderoTrial-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../fonts/AderoTrial-Bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/AderoTrial-ExtraBold.otf", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-text",
  adjustFontFallback: "Arial",
});
