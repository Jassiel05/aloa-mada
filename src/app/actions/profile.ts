"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasCandidateRole, hasRecruiterRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { Availability, RateUnit } from "@/lib/types";

export interface ProfileInput {
  first_name: string;
  last_name: string;
  city: string;
  headline: string;
  photo_path: string | null;
  /** Case « c'est une vraie photo de moi », exigée quand la photo est nouvelle ou changée */
  photo_certified?: boolean;
  phone: string;
  whatsapp: string;
  /** Lecture seule : CV déjà enregistré (géré par saveCv / removeCv) */
  cv?: { size: number | null; updatedAt: string | null } | null;
  candidate?: {
    job_title: string;
    skills: string[];
    experience_years: number | null;
    languages: string[];
    contract_types: string[];
    rate_amount: number | null;
    rate_currency: "MGA" | "EUR";
    rate_unit: RateUnit;
    availability: Availability;
    available_from: string | null;
    work_modes: string[];
    bio: string;
    portfolio_url: string;
    notice_period: string;
    school: string;
  };
  recruiter?: {
    kind: "individual" | "company";
    company_name: string;
    sector: string;
    company_size: string;
    website: string;
    nif_stat: string;
    looking_for: string;
  };
}

const clean = (s: string | undefined | null) => (s ?? "").trim() || null;

/** Lien saisi par le membre → adresse http(s) propre, « https:// » ajouté si besoin. */
function cleanUrl(s: string | undefined | null): { url: string | null; bad?: boolean } {
  const raw = clean(s);
  if (!raw) return { url: null };
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !u.hostname.includes(".")) return { url: null, bad: true };
    return { url: u.toString().slice(0, 300) };
  } catch {
    return { url: null, bad: true };
  }
}

export async function saveProfile(input: ProfileInput, submit: boolean): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { data: current } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (submit) {
    if (!clean(input.first_name) || !clean(input.city)) return { error: "Prénom et ville sont obligatoires." };
    if (!input.photo_path) return { error: "La photo est obligatoire : ajoutez une vraie photo de vous, visage net." };
    if (input.photo_path !== current?.photo_path && !input.photo_certified) {
      return { error: "Cochez « C'est une vraie photo de moi » : un profil avec un logo, un dessin ou la photo d'une autre personne est refusé." };
    }
    if (input.candidate && !clean(input.candidate.job_title)) return { error: "Indiquez votre métier." };
    if (input.candidate && input.candidate.contract_types.length === 0) return { error: "Choisissez au moins un type de collaboration." };
  }

  const portfolio = cleanUrl(input.candidate?.portfolio_url);
  if (portfolio.bad) return { error: "Le lien portfolio n'est pas valide (ex. https://behance.net/votre-nom)." };
  const website = cleanUrl(input.recruiter?.website);
  if (website.bad) return { error: "L'adresse du site web n'est pas valide (ex. https://votre-entreprise.mg)." };

  const nextStatus = submit && current && (current.status === "draft" || current.status === "rejected") ? "pending" : undefined;

  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      first_name: clean(input.first_name),
      last_name: clean(input.last_name),
      city: clean(input.city),
      headline: clean(input.headline)?.slice(0, 160) ?? null,
      photo_path: input.photo_path,
      photo_hidden: false,
      ...(submit ? { onboarded: true } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
    })
    .eq("id", user.id);
  if (pErr) return { error: pErr.message };

  const { error: cErr } = await supabase
    .from("profile_contacts")
    .upsert({ profile_id: user.id, email: user.email, phone: clean(input.phone), whatsapp: clean(input.whatsapp) });
  if (cErr) return { error: cErr.message };

  if (current && hasCandidateRole(current) && input.candidate) {
    const c = input.candidate;
    const { error } = await supabase.from("candidate_details").upsert({
      profile_id: user.id,
      job_title: clean(c.job_title),
      skills: c.skills.map((s) => s.trim()).filter(Boolean).slice(0, 12),
      experience_years: c.experience_years,
      languages: c.languages,
      contract_types: c.contract_types,
      rate_amount: c.rate_unit === "negotiable" ? null : c.rate_amount,
      rate_currency: c.rate_currency,
      rate_unit: c.rate_unit,
      availability: c.availability,
      available_from: c.availability === "available_from" ? c.available_from : null,
      work_modes: c.work_modes,
      bio: clean(c.bio),
      portfolio_url: portfolio.url,
      notice_period: clean(c.notice_period),
      school: clean(c.school),
    });
    if (error) return { error: error.message };
  }

  if (current && hasRecruiterRole(current) && input.recruiter) {
    const r = input.recruiter;
    const { error } = await supabase.from("recruiter_details").upsert({
      profile_id: user.id,
      kind: r.kind,
      company_name: r.kind === "company" ? clean(r.company_name) : null,
      sector: clean(r.sector),
      company_size: clean(r.company_size),
      website: website.url,
      nif_stat: clean(r.nif_stat),
      looking_for: clean(r.looking_for),
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Interrupteur rapide « Disponible / En poste » */
export async function setAvailability(availability: Availability) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("candidate_details").update({ availability }).eq("profile_id", user.id);
  revalidatePath("/", "layout");
}

/** Enregistre le CV que le navigateur vient d'envoyer (déjà compressé) et supprime l'ancien. */
export async function saveCv(path: string, size: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };
  if (!path.startsWith(`${user.id}/`) || !path.endsWith(".pdf")) return { error: "Fichier invalide." };
  const { data: me } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!me || !hasCandidateRole(me)) return { error: "Le CV est réservé aux profils candidats." };

  const { data: before } = await supabase.from("candidate_details").select("cv_path").eq("profile_id", user.id).maybeSingle();
  const { error } = await supabase
    .from("candidate_details")
    .upsert({ profile_id: user.id, cv_path: path, cv_size: Math.round(size), cv_updated_at: new Date().toISOString() });
  if (error) return { error: "Enregistrement impossible. Réessayez." };
  if (before?.cv_path && before.cv_path !== path) await supabase.storage.from("cvs").remove([before.cv_path]);
  revalidatePath("/", "layout");
  return {};
}

export async function removeCv(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };
  const { data: before } = await supabase.from("candidate_details").select("cv_path").eq("profile_id", user.id).maybeSingle();
  await supabase.from("candidate_details").update({ cv_path: null, cv_size: null, cv_updated_at: null }).eq("profile_id", user.id);
  if (before?.cv_path) await supabase.storage.from("cvs").remove([before.cv_path]);
  revalidatePath("/", "layout");
  return {};
}

/** Administrateur : choisir d'être aussi candidat et/ou recruteur (le rôle principal reste admin). */
export async function setAdminRoles(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/profil");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/profil");

  const candidate = formData.get("candidate") === "on";
  const recruiter = formData.get("recruiter") === "on";
  await supabase.from("profiles").update({ admin_is_candidate: candidate, admin_is_recruiter: recruiter }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect(candidate ? "/profil?role=candidate" : recruiter ? "/profil?role=recruiter" : "/profil");
}
