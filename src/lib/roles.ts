import type { Profile } from "./types";

type RoleInfo = Pick<Profile, "role"> & Partial<Pick<Profile, "admin_is_candidate" | "admin_is_recruiter">>;

/**
 * Un membre est candidat ou recruteur selon son rôle. Un administrateur reste « admin »
 * (tous les droits) mais peut aussi, par option, être candidat et/ou recruteur.
 */
export const hasCandidateRole = (p: RoleInfo) => p.role === "candidate" || (p.role === "admin" && !!p.admin_is_candidate);
export const hasRecruiterRole = (p: RoleInfo) => p.role === "recruiter" || (p.role === "admin" && !!p.admin_is_recruiter);

/**
 * Galerie : les candidats et recruteurs s'affichent comme avant. Un administrateur n'apparaît
 * que s'il a activé le rôle ET rempli sa fiche (métier pour un candidat, structure pour un recruteur).
 */
export function visibleInGallery(
  p: RoleInfo & { candidate_details?: unknown; recruiter_details?: unknown },
  recruiters: boolean,
): boolean {
  if (p.role !== "admin") return true;
  if (recruiters) return !!p.admin_is_recruiter && !!p.recruiter_details;
  const job = (p.candidate_details as { job_title?: string | null } | null | undefined)?.job_title;
  return !!p.admin_is_candidate && !!job;
}
