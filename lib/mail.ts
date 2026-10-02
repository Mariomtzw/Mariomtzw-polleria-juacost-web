/**
 * Envío de correos con Resend (https://resend.com) por su API HTTP.
 * No agrega dependencias: usa `fetch`.
 *
 * Variables:
 *  - RESEND_API_KEY  clave de la cuenta de Resend (obligatoria en producción).
 *  - MAIL_FROM       remitente. Sin dominio verificado se usa el de pruebas de
 *                    Resend, que SOLO entrega al correo dueño de esa cuenta.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Pollos Juacos't <onboarding@resend.dev>";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type MailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "rejected" | "network"; detail: string };

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function mailFrom(): string {
  return process.env.MAIL_FROM?.trim() || DEFAULT_FROM;
}

/** Usa el remitente de pruebas de Resend (solo entrega al dueño de la cuenta de Resend). */
export function usingTestSender(): boolean {
  return /@resend\.dev>?\s*$/i.test(mailFrom());
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // En desarrollo, sin clave, el correo se escribe en la terminal para poder
    // probar el flujo. En producción nunca se imprime: lleva un enlace secreto.
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[correo de desarrollo] Para: ${mail.to}\nAsunto: ${mail.subject}\n\n${mail.text}\n`);
      return { ok: true };
    }
    return { ok: false, reason: "not_configured", detail: "Falta RESEND_API_KEY." };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
    });
    if (res.ok) return { ok: true };

    // Resend responde { statusCode, name, message }.
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, reason: "rejected", detail: `${res.status}: ${body?.message ?? res.statusText}` };
  } catch (err) {
    return { ok: false, reason: "network", detail: (err as Error).message };
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Correo con el enlace para poner una contraseña nueva. */
export function passwordResetMail(to: string, link: string, minutes: number): Mail {
  const safeLink = escapeHtml(link);
  return {
    to,
    subject: "Restablece tu contraseña del panel de Pollos Juacos't",
    text: [
      "Recibimos una solicitud para restablecer la contraseña del panel de Pollos Juacos't.",
      "",
      "Abre este enlace para elegir una contraseña nueva:",
      link,
      "",
      `El enlace vence en ${minutes} minutos y solo sirve una vez.`,
      "Si no fuiste tú, ignora este correo: tu contraseña no cambia.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#71717a">Panel de Pollos Juacos't</p>
<h1 style="margin:0 0 16px;font-size:20px">Restablece tu contraseña</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5">Recibimos una solicitud para restablecer la contraseña del panel. Pulsa el botón para elegir una nueva.</p>
<p style="margin:0 0 24px"><a href="${safeLink}" style="display:inline-block;background:#f97316;color:#0a0a0a;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:12px">Elegir contraseña nueva</a></p>
<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#52525b">El enlace vence en ${minutes} minutos y solo sirve una vez.</p>
<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#52525b">Si no fuiste tú, ignora este correo: tu contraseña no cambia.</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;word-break:break-all">Si el botón no abre, copia este enlace en tu navegador:<br>${safeLink}</p>
</td></tr></table>
</td></tr></table>
</body></html>`,
  };
}

/** Correo de prueba desde "Mi cuenta", para confirmar que la recuperación funcionará. */
export function testMail(to: string): Mail {
  return {
    to,
    subject: "Prueba de correo del panel de Pollos Juacos't",
    text: "Este es un correo de prueba. Si lo estás leyendo, la recuperación de contraseña por correo funciona.",
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:24px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b">
<h1 style="font-size:18px;margin:0 0 12px">Correo de prueba</h1>
<p style="font-size:15px;line-height:1.5;margin:0">Si lo estás leyendo, la recuperación de contraseña por correo del panel de Pollos Juacos't funciona.</p>
</body></html>`,
  };
}
