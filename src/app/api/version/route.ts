import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Version actuellement en ligne (commit déployé sur Vercel). Comparée par le navigateur pour proposer « Mettre à jour ». */
export function GET() {
  return NextResponse.json(
    { version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? "local" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
