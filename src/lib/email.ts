/** Envoi d'emails via l'API Resend (https://resend.com). Sans clé, rien n'est envoyé et le site continue de fonctionner. */

import { siteUrl } from "./site";

export const SITE_URL = siteUrl();

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Gabarit simple aux couleurs du site. `body` doit déjà être échappé. */
export function emailLayout(title: string, body: string, cta?: { href: string; label: string }) {
  const button = cta
    ? `<p style="margin:28px 0 0"><a href="${cta.href}" style="display:inline-block;background:#C2410C;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#1C1917">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="font-family:Georgia,serif;font-size:24px;font-weight:600;margin:0 0 24px">aloa<span style="color:#C2410C">·</span>mada</p>
<div style="background:#ffffff;border:1px solid #E7E1D8;border-radius:16px;padding:28px">
<h1 style="font-family:Georgia,serif;font-size:24px;line-height:1.2;margin:0 0 16px">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.6">${body}</div>${button}
</div>
<p style="font-size:12px;color:#57524C;margin:20px 4px 0">Vous recevez cet email car vous avez un compte sur Aloa-Mada. <a href="${SITE_URL}/alertes" style="color:#57524C">Gérer mes alertes</a></p>
</div></body></html>`;
}

export async function sendEmail(to: string | null | undefined, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) {
    console.info(`[email] non envoyé (${!key ? "RESEND_API_KEY manquante" : "destinataire inconnu"}) : ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Aloa-Mada <onboarding@resend.dev>", to, subject, html }),
    });
    if (!res.ok) console.error("[email] échec", res.status, await res.text());
  } catch (e) {
    console.error("[email] erreur réseau", e);
  }
}
