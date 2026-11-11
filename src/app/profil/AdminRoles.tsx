import { setAdminRoles } from "@/app/actions/profile";

/** Administrateur : on reste admin, et on peut en plus être candidat et/ou recruteur. */
export default function AdminRoles({ candidate, recruiter }: { candidate: boolean; recruiter: boolean }) {
  return (
    <form action={setAdminRoles} className="card mt-6 p-5">
      <p className="font-bold">Rôles du compte administrateur</p>
      <p className="mt-1 text-sm text-muted">
        Vous restez administrateur. Vous pouvez en plus avoir un profil candidat et/ou recruteur, visible dans la galerie une fois la fiche remplie.
        L&apos;import du CV n&apos;est possible que si « Aussi candidat » est coché.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="candidate" defaultChecked={candidate} className="size-4 accent-brand" />
          Aussi candidat
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="recruiter" defaultChecked={recruiter} className="size-4 accent-brand" />
          Aussi recruteur
        </label>
      </div>
      <button type="submit" className="btn-outline mt-4">Enregistrer mes rôles</button>
    </form>
  );
}
