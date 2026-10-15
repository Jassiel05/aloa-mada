import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/viewer";
import { loadProfileInput } from "@/lib/profile-input";
import ProfileForm from "@/components/ProfileForm";
import { chooseRole } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Compléter mon profil" };

export default async function OnboardingPage() {
  const viewer = await requireViewer("/onboarding");
  if (viewer.profile.onboarded) redirect("/profil");
  if (viewer.isAdmin) redirect("/admin");
  const initial = await loadProfileInput(viewer.profile);
  const role = viewer.profile.role === "recruiter" ? "recruiter" : "candidate";

  return (
    <main className="container-page max-w-3xl py-12">
      <h1 className="page-title">
        Bienvenue{viewer.profile.first_name ? `, ${viewer.profile.first_name}` : ""}
      </h1>
      <p className="mt-2 mb-10 text-muted">
        {role === "candidate"
          ? "Trois petites étapes et votre portrait rejoint la galerie."
          : "Deux petites étapes et vous pouvez contacter les talents."}
      </p>
      <div className="mb-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm font-semibold">Vous êtes :</p>
        {(["candidate", "recruiter"] as const).map((r) => (
          <form key={r} action={chooseRole.bind(null, r)}>
            <button
              type="submit"
              aria-pressed={role === r}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${role === r ? "bg-night text-white" : "border border-field bg-white text-ink hover:border-ink"}`}
            >
              {r === "candidate" ? "Je cherche du travail" : "Je recrute"}
            </button>
          </form>
        ))}
      </div>
      <ProfileForm key={role} userId={viewer.id} role={role} initial={initial} mode="onboarding" />
    </main>
  );
}
