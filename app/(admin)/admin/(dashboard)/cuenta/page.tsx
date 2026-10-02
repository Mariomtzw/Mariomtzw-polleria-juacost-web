import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireOwner } from "@/lib/auth-guards";
import { mailConfigured, usingTestSender } from "@/lib/mail";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { ChangeEmailForm, ChangePasswordForm, TestEmailButton } from "@/components/admin/account/AccountForms";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const session = await requireOwner();
  const email = session.user.email ?? "";
  const configured = mailConfigured();
  // En desarrollo, sin clave, el correo se escribe en la terminal (ver lib/mail.ts).
  const devOnly = !configured && process.env.NODE_ENV !== "production";

  return (
    <div className="space-y-6">
      <PageHeader title="Mi cuenta" description="Tu contraseña, tu correo de acceso y la recuperación por correo." />

      <section aria-labelledby="cuenta-password" className="material rounded-3xl p-5">
        <h2 id="cuenta-password" className="font-medium text-white">Cambiar contraseña</h2>
        <p className="mb-4 mt-1 max-w-[72ch] text-sm text-neutral-400">
          Al cambiarla se cierra la sesión en todos los dispositivos y vuelves a entrar con la nueva.
        </p>
        <ChangePasswordForm email={email} />
      </section>

      <section aria-labelledby="cuenta-correo" className="material rounded-3xl p-5">
        <h2 id="cuenta-correo" className="font-medium text-white">Correo de acceso</h2>
        <p className="mb-4 mt-1 max-w-[72ch] text-sm text-neutral-400">
          Hoy entras con <strong className="font-medium text-neutral-200">{email}</strong>. A este correo llega el enlace si
          olvidas la contraseña, así que debe ser un buzón que sí puedas abrir.
        </p>
        <ChangeEmailForm email={email} />
      </section>

      <section aria-labelledby="cuenta-recuperacion" className="material rounded-3xl p-5">
        <h2 id="cuenta-recuperacion" className="font-medium text-white">Recuperación por correo</h2>
        {configured ? (
          <p className="mb-4 mt-2 flex max-w-[72ch] items-start gap-2 text-sm text-emerald-300">
            <CheckCircle2 aria-hidden size={16} className="mt-0.5 shrink-0" />
            <span>
              El envío de correos está configurado. Si olvidas la contraseña, usa «¿Olvidaste tu contraseña?» en la pantalla de
              entrada.
            </span>
          </p>
        ) : devOnly ? (
          <p className="mb-4 mt-2 flex max-w-[72ch] items-start gap-2 text-sm text-amber-300">
            <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
            <span>
              Modo desarrollo sin <code>RESEND_API_KEY</code>: los correos no se envían, se escriben en la terminal donde corre
              <code> npm run dev</code>.
            </span>
          </p>
        ) : (
          <p className="mb-4 mt-2 flex max-w-[72ch] items-start gap-2 text-sm text-amber-300">
            <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
            <span>
              Todavía no se pueden enviar correos: falta la clave <code>RESEND_API_KEY</code> en Vercel. Mientras tanto, la
              contraseña solo se puede restablecer desde la computadora de quien administra el sitio.
            </span>
          </p>
        )}
        {configured && usingTestSender() ? (
          <p className="mb-4 max-w-[72ch] text-sm text-neutral-400">
            Se usa el remitente de pruebas de Resend, que solo entrega al correo con el que se creó la cuenta de Resend. Ese
            correo y tu correo de acceso deben ser el mismo.
          </p>
        ) : null}
        <p className="mb-3 max-w-[72ch] text-sm text-neutral-400">
          Compruébalo ahora, no el día que la olvides: envía un correo de prueba a {email}.
        </p>
        <TestEmailButton />
      </section>
    </div>
  );
}
