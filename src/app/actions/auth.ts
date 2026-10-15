"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

export type FormState = { error?: string; info?: string } | undefined;

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Email ou mot de passe incorrect, ou email pas encore confirmé." };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const role = formData.get("role") === "recruiter" ? "recruiter" : "candidate";
  const firstName = String(formData.get("first_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!formData.get("terms")) return { error: "Merci d'accepter les CGU et la politique de confidentialité." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };

  const supabase = await createClient();
  // Le lien de confirmation renvoie toujours sur l'adresse publique du site (jamais sur une URL d'aperçu Vercel)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, first_name: firstName },
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return { info: `Presque fini ! Nous venons d'envoyer un email à ${email}. Cliquez sur « Confirmer mon email » : c'est tout, votre compte est activé.` };
  }
  redirect("/onboarding");
}

/** Connexion ou inscription avec Google / Apple (OAuth géré par Supabase). */
export async function signInWithProvider(formData: FormData) {
  const provider = formData.get("provider") === "apple" ? "apple" : "google";
  const next = safeNext(formData.get("next"));
  const role = formData.get("role");

  // Le rôle choisi à l'inscription est retrouvé au retour, dans /auth/callback
  if (role === "recruiter" || role === "candidate") {
    (await cookies()).set("aloa_role", role, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 600 });
  }

  const supabase = await createClient();
  const site = (await headers()).get("origin") ?? siteUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/connexion?erreur=fournisseur");
  redirect(data.url);
}

/** Avant d'avoir terminé son profil, un membre peut encore changer de rôle. */
export async function chooseRole(role: "candidate" | "recruiter") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  await supabase.from("profiles").update({ role }).eq("id", user.id).eq("onboarded", false);
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Renvoie l'email de confirmation (lien expiré ou email non reçu). */
export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Indiquez l'email utilisé à l'inscription." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${siteUrl()}/auth/confirm` } });
  if (error) return { error: "Envoi impossible pour le moment. Réessayez dans une minute." };
  return { info: `Si un compte non confirmé existe pour ${email}, un nouvel email vient d'être envoyé.` };
}
