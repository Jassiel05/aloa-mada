import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Lien de l'email de confirmation.
 * - Lien « token_hash » (modèle d'email Aloa-Mada) : fonctionne même si l'email est ouvert sur un autre appareil.
 * - Ancien lien « code » : l'email est déjà confirmé par Supabase avant d'arriver ici ; si la session ne peut pas
 *   être ouverte (autre appareil, autre navigateur), on affiche simplement « Email confirmé, connectez-vous ».
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const code = searchParams.get("code");
  const done = (etat: string) => NextResponse.redirect(`${origin}/email-confirme?etat=${etat}`, { headers: { "Cache-Control": "no-store" } });

  if (searchParams.get("error") || searchParams.get("error_code")) return done("expire");

  const supabase = await createClient();
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return done(error ? "expire" : "ok");
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return done(error ? "confirme" : "ok");
  }
  return done("expire");
}
