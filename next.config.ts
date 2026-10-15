import type { NextConfig } from "next";

const YEAR = 60 * 60 * 24 * 365;

const nextConfig: NextConfig = {
  // Identifiant de la version construite, comparé à /api/version pour proposer « Mettre à jour »
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? "local" },
  compress: true,
  poweredByHeader: false,
  images: {
    // AVIF puis WebP : les photos de la galerie pèsent en général 15 à 40 Ko
    formats: ["image/avif", "image/webp"],
    // Chaque photo a un nom unique (horodaté) : elle peut rester en cache un an
    minimumCacheTTL: YEAR,
    // Moins de tailles = moins de variantes à générer, cache plus efficace
    deviceSizes: [640, 828, 1080, 1280],
    imageSizes: [96, 128, 180, 256, 384],
    qualities: [70, 75],
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  async headers() {
    return [
      { source: "/brand/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
