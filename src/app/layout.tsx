import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/manrope";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UpdateBanner from "@/components/UpdateBanner";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Aloa-Mada — des visages, pas des CV", template: "%s · Aloa-Mada" },
  description:
    "Recrutement direct à Madagascar : parcourez les talents disponibles, ouvrez une fiche, envoyez un message.",
  openGraph: {
    type: "website",
    locale: "fr_MG",
    siteName: "Aloa-Mada",
    title: "Aloa-Mada — des visages, pas des CV",
    description: "Recrutement direct à Madagascar : talents, recruteurs et offres, en contact en deux clics.",
  },
};

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
