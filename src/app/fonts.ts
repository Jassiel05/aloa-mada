import localFont from "next/font/local";

/*
 * Polices auto-hébergées, jeu « latin » uniquement (français, malagasy, anglais) :
 * 66 Ko au total, préchargées, avec une police de secours aux mêmes proportions
 * pour éviter que la page « saute » pendant le chargement.
 */
export const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope",
  fallback: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

export const bricolage = localFont({
  src: "../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-bricolage",
  fallback: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});
