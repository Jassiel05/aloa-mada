import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, Viewer } from "./types";

/** Utilisateur connecté + droits (miroir de la fonction SQL can(), qui reste la vraie protection). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) return null;

  const isAdmin = profile.role === "admin";
  const notExpired = !profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date();
  const isPro = isAdmin || (profile.plan === "pro" && notExpired);
  const approved = profile.status === "approved";

  return {
    id: user.id,
    email: user.email ?? null,
    profile,
    isPro,
    isAdmin,
    can: {
      apply: isAdmin || (profile.role === "candidate" && isPro && approved),
      startConversation: isAdmin || (approved && (profile.role === "recruiter" || (profile.role === "candidate" && isPro))),
      publishOffer: isAdmin || (profile.role === "recruiter" && isPro && approved),
      seeContacts: isAdmin || profile.role === "recruiter" || (profile.role === "candidate" && isPro),
    },
  };
});

export async function requireViewer(next = "/") {
  const viewer = await getViewer();
  if (!viewer) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** Oblige à terminer l'inscription avant d'utiliser le reste du site. */
export async function requireOnboarded(next = "/") {
  const viewer = await requireViewer(next);
  if (!viewer.profile.onboarded && !viewer.isAdmin) redirect("/onboarding");
  return viewer;
}
