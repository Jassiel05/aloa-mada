import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/offres`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pro`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/inscription`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/connexion`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Offres ouvertes (publiques)
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await supabase
        .from("offers")
        .select("id, created_at")
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      for (const o of data ?? []) {
        pages.push({ url: `${base}/offres/${o.id}`, lastModified: o.created_at, changeFrequency: "weekly", priority: 0.7 });
      }
    } catch {
      // base injoignable : on garde les pages fixes
    }
  }
  return pages;
}
