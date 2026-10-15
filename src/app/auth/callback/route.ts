import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Retour des liens de confirmation email et des connexions Google / Apple. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  let next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const store = await cookies();
      const role = store.get("aloa_role")?.value;
      store.delete("aloa_role");

      const { data: profile } = await supabase.from("profiles").select("role, onboarded").eq("id", data.user.id).maybeSingle();
      if (profile && !profile.onboarded) {
        // Nouveau membre via Google / Apple : on applique le rôle choisi à l'inscription
        if ((role === "recruiter" || role === "candidate") && profile.role !== role && profile.role !== "admin") {
          await supabase.from("profiles").update({ role }).eq("id", data.user.id);
        }
        if (profile.role !== "admin") next = "/onboarding";
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
}
