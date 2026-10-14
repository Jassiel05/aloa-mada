import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Les aperçus Vercel ne doivent jamais être indexés
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/auth/", "/onboarding", "/profil", "/messages", "/favoris", "/alertes", "/mes-offres", "/candidatures", "/offres/nouvelle"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
