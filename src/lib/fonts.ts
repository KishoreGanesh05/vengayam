import { Lora, Noto_Sans_Tamil, Inter } from "next/font/google";

/**
 * English serif font for headings — gives a newspaper/editorial feel.
 * Lora is a well-balanced serif with good readability at various sizes.
 */
export const lora = Lora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * English body font — clean sans-serif for readability in long-form content.
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Tamil font — Noto Sans Tamil provides excellent readability for Tamil text.
 * Subsetted to tamil characters for performance.
 */
export const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-tamil",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
