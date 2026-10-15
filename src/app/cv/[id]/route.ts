import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ouvre le CV d'un candidat via un lien temporaire (2 minutes).
 * Les droits sont vérifiés par Supabase (règles de l'espace « cvs ») :
 * la personne elle-même, les recruteurs, les membres Pro et l'admin.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { origin } = new URL(request.url);
  const noStore = { headers: { "Cache-Control": "private, no-store" } };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/connexion?next=${encodeURIComponent(`/?p=${id}`)}`, noStore);

  const { data: details } = await supabase.from("candidate_details").select("cv_path").eq("profile_id", id).maybeSingle();
  if (!details?.cv_path) return new NextResponse("Ce CV n'est plus disponible.", { status: 404, ...noStore });

  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(details.cv_path, 120);
  if (error || !data?.signedUrl) {
    // Candidat Simple : le CV, comme les coordonnées, est réservé aux recruteurs et aux membres Pro
    return NextResponse.redirect(`${origin}/pro?acces=cv`, noStore);
  }
  return NextResponse.redirect(data.signedUrl, noStore);
}
