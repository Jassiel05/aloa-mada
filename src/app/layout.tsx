import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/manrope";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UpdateBanner from "@/components/UpdateBanner";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Aloa-Mada · Recrutement direct à Madagascar", template: "%s · Aloa-Mada" },
  description:
    "Électriciens, comptables, chauffeurs, développeurs… Parcourez des profils avec photo vérifiée et écrivez directement à la personne. Inscription gratuite.",
  openGraph: {
    type: "website",
    locale: "fr_MG",
    siteName: "Aloa-Mada",
    title: "Aloa-Mada · Les talents de Madagascar, à visage découvert",
    description: "Recrutement direct à Madagascar : profils avec photo vérifiée, offres d'emploi et contact en deux clics.",
  },
};

export const viewport: Viewport = { themeColor: "#0d2b22" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <UpdateBanner />
      </body>
    </html>
  );
}
