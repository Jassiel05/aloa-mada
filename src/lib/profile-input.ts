import type { ProfileInput } from "@/app/actions/profile";
import { createClient } from "./supabase/server";
import type { CandidateDetails, Contacts, Profile, RecruiterDetails } from "./types";

/** Charge le profil complet de l'utilisateur pour pré-remplir le formulaire. */
export async function loadProfileInput(profile: Profile): Promise<ProfileInput> {
  const supabase = await createClient();
  const [{ data: contacts }, { data: cand }, { data: rec }] = await Promise.all([
    supabase.from("profile_contacts").select("*").eq("profile_id", profile.id).maybeSingle<Contacts>(),
    supabase.from("candidate_details").select("*").eq("profile_id", profile.id).maybeSingle<CandidateDetails>(),
    supabase.from("recruiter_details").select("*").eq("profile_id", profile.id).maybeSingle<RecruiterDetails>(),
  ]);

  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    city: profile.city ?? "",
    headline: profile.headline ?? "",
    photo_path: profile.photo_path,
    phone: contacts?.phone ?? "",
    whatsapp: contacts?.whatsapp ?? "",
    candidate: {
      job_title: cand?.job_title ?? "",
      skills: cand?.skills ?? [],
      experience_years: cand?.experience_years ?? null,
      languages: cand?.languages ?? ["Malagasy", "Français"],
      contract_types: cand?.contract_types ?? [],
      rate_amount: cand?.rate_amount ?? null,
      rate_currency: cand?.rate_currency ?? "MGA",
      rate_unit: cand?.rate_unit ?? "month",
      availability: cand?.availability ?? "available",
      available_from: cand?.available_from ?? null,
      work_modes: cand?.work_modes ?? [],
      bio: cand?.bio ?? "",
      portfolio_url: cand?.portfolio_url ?? "",
      notice_period: cand?.notice_period ?? "",
      school: cand?.school ?? "",
    },
    recruiter: {
      kind: rec?.kind ?? "individual",
      company_name: rec?.company_name ?? "",
      sector: rec?.sector ?? "",
      company_size: rec?.company_size ?? "",
      website: rec?.website ?? "",
      nif_stat: rec?.nif_stat ?? "",
      looking_for: rec?.looking_for ?? "",
    },
  };
}
