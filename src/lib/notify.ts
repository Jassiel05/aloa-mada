import { createAdminClient } from "./supabase/admin";
import { SITE_URL, emailLayout, escapeHtml, sendEmail } from "./email";
import { contractLabel, displayName } from "./labels";

/**
 * Notifications par email. Chaque fonction est « best effort » : une erreur
 * n'empêche jamais l'action de l'utilisateur d'aboutir.
 */

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

async function withAdmin(fn: (admin: Admin) => Promise<void>) {
  const admin = createAdminClient();
  if (!admin) {
    console.info("[notify] SUPABASE_SERVICE_ROLE_KEY manquante : notifications désactivées");
    return;
  }
  try {
    await fn(admin);
  } catch (e) {
    console.error("[notify]", e);
  }
}

async function emailOf(admin: Admin, userId: string) {
  const { data } = await admin.from("profile_contacts").select("email").eq("profile_id", userId).maybeSingle();
  return (data?.email as string | null) ?? null;
}

async function nameOf(admin: Admin, userId: string) {
  const { data } = await admin.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle();
  return displayName(data?.first_name ?? null, data?.last_name ?? null);
}

/** Nouveau message : un seul email tant que le destinataire n'a pas lu la conversation. */
export function notifyNewMessage(conversationId: string, senderId: string, body: string) {
  return withAdmin(async (admin) => {
    const { data: conv } = await admin.from("conversations").select("user_a, user_b").eq("id", conversationId).single();
    if (!conv) return;
    const recipient = conv.user_a === senderId ? conv.user_b : conv.user_a;
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender_id", senderId)
      .is("read_at", null);
    if ((count ?? 0) > 1) return; // déjà prévenu, il n'a pas encore lu

    const [to, from] = await Promise.all([emailOf(admin, recipient), nameOf(admin, senderId)]);
    const excerpt = body.length > 220 ? body.slice(0, 220) + "…" : body;
    await sendEmail(
      to,
      `${from} vous a écrit sur Aloa-Mada`,
      emailLayout(
        `${from} vous a écrit`,
        `<p style="margin:0;padding:16px;background:#EEF0F6;border-radius:12px;white-space:pre-line">${escapeHtml(excerpt)}</p>`,
        { href: `${SITE_URL}/messages/${conversationId}`, label: "Répondre" },
      ),
    );
  });
}

export function notifyApplication(offerId: string, candidateId: string) {
  return withAdmin(async (admin) => {
    const { data: offer } = await admin.from("offers").select("title, recruiter_id").eq("id", offerId).single();
    if (!offer) return;
    const [to, who] = await Promise.all([emailOf(admin, offer.recruiter_id), nameOf(admin, candidateId)]);
    await sendEmail(
      to,
      `Nouvelle candidature : ${offer.title}`,
      emailLayout(
        "Nouvelle candidature",
        `<p style="margin:0"><strong>${escapeHtml(who)}</strong> a postulé à votre offre « ${escapeHtml(offer.title)} ».</p>`,
        { href: `${SITE_URL}/mes-offres`, label: "Voir la candidature" },
      ),
    );
  });
}

export function notifyProfileStatus(profileId: string, approved: boolean, reason?: string) {
  return withAdmin(async (admin) => {
    const to = await emailOf(admin, profileId);
    if (approved) {
      await sendEmail(
        to,
        "Votre profil est en ligne sur Aloa-Mada",
        emailLayout("Votre profil est validé", "<p style=\"margin:0\">Votre portrait apparaît maintenant dans la galerie. Pensez à garder votre disponibilité à jour.</p>", {
          href: `${SITE_URL}/profil`,
          label: "Voir mon profil",
        }),
      );
    } else {
      await sendEmail(
        to,
        "Votre profil Aloa-Mada est à corriger",
        emailLayout(
          "Une petite correction et c'est bon",
          `<p style="margin:0">${escapeHtml(reason ?? "Votre photo ne respecte pas les règles : fond uni, visage net, tenue correcte.")}</p><p>Modifiez votre profil puis enregistrez : il sera revérifié.</p>`,
          { href: `${SITE_URL}/profil`, label: "Corriger mon profil" },
        ),
      );
    }
  });
}

export function notifyProActivated(userId: string) {
  return withAdmin(async (admin) => {
    const [{ data: p }, to] = await Promise.all([
      admin.from("profiles").select("plan_expires_at").eq("id", userId).single(),
      emailOf(admin, userId),
    ]);
    const until = p?.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString("fr-FR") : null;
    await sendEmail(
      to,
      "Votre compte Pro est activé",
      emailLayout("Bienvenue en Pro", `<p style="margin:0">Paiement reçu, merci ! Votre compte Pro est actif${until ? ` jusqu'au ${until}` : ""}.</p>`, {
        href: SITE_URL,
        label: "Aller sur Aloa-Mada",
      }),
    );
  });
}

type AlertRow = { user_id: string; keyword: string | null; city: string | null; contract: string | null };

function matches(a: AlertRow, text: string, city: string | null, contracts: string[]) {
  if (a.city && a.city !== city) return false;
  if (a.contract && !contracts.includes(a.contract)) return false;
  if (a.keyword && !text.toLowerCase().includes(a.keyword.toLowerCase())) return false;
  return true;
}

/** Un talent vient d'être validé : on prévient les recruteurs dont l'alerte correspond. */
export function runTalentAlerts(profileId: string) {
  return withAdmin(async (admin) => {
    const { data: p } = await admin
      .from("profiles")
      .select("first_name, last_name, city, role, candidate_details(job_title, skills, contract_types, availability)")
      .eq("id", profileId)
      .single();
    const c = (p?.candidate_details as unknown as { job_title: string | null; skills: string[]; contract_types: string[]; availability: string } | null) ?? null;
    if (!p || p.role !== "candidate" || !c || c.availability === "employed") return;

    const { data: alerts } = await admin.from("alerts").select("user_id, keyword, city, contract").eq("target", "talents").eq("active", true);
    const text = [c.job_title ?? "", ...(c.skills ?? [])].join(" ");
    const users = [...new Set(((alerts ?? []) as AlertRow[]).filter((a) => a.user_id !== profileId && matches(a, text, p.city, c.contract_types ?? [])).map((a) => a.user_id))];

    const name = displayName(p.first_name, p.last_name);
    for (const u of users) {
      await sendEmail(
        await emailOf(admin, u),
        `Nouveau talent : ${c.job_title ?? "profil"} à ${p.city ?? "Madagascar"}`,
        emailLayout(
          "Un talent correspond à votre alerte",
          `<p style="margin:0"><strong>${escapeHtml(name)}</strong>, ${escapeHtml(c.job_title ?? "")}${p.city ? ` à ${escapeHtml(p.city)}` : ""}, vient de rejoindre Aloa-Mada.</p>`,
          { href: `${SITE_URL}/?p=${profileId}`, label: "Voir le profil" },
        ),
      );
    }
  });
}

/** Une offre vient d'être publiée : on prévient les candidats dont l'alerte correspond. */
export function runOfferAlerts(offerId: string) {
  return withAdmin(async (admin) => {
    const { data: o } = await admin.from("offers").select("title, job_title, city, contract_type, recruiter_id").eq("id", offerId).single();
    if (!o) return;
    const { data: alerts } = await admin.from("alerts").select("user_id, keyword, city, contract").eq("target", "offers").eq("active", true);
    const text = `${o.title} ${o.job_title ?? ""}`;
    const users = [...new Set(((alerts ?? []) as AlertRow[]).filter((a) => a.user_id !== o.recruiter_id && matches(a, text, o.city, [o.contract_type])).map((a) => a.user_id))];
    for (const u of users) {
      await sendEmail(
        await emailOf(admin, u),
        `Nouvelle offre : ${o.title}`,
        emailLayout(
          "Une offre correspond à votre alerte",
          `<p style="margin:0"><strong>${escapeHtml(o.title)}</strong> · ${escapeHtml(contractLabel(o.contract_type))}${o.city ? ` · ${escapeHtml(o.city)}` : ""}</p>`,
          { href: `${SITE_URL}/offres/${offerId}`, label: "Voir l'offre" },
        ),
      );
    }
  });
}
