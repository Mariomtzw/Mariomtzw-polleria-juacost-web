import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { signIn } from "@/auth";
import { getOwnerSession } from "@/lib/auth-guards";
import { AuthShell } from "@/components/admin/account/AuthShell";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

export const metadata: Metadata = { title: "Entrar" };

/** Avisos que llegan en `?aviso=` después de cambiar o restablecer la contraseña. */
const AVISOS: Record<string, string> = {
  restablecida: "Contraseña actualizada. Entra con la nueva.",
  cambiada: "Contraseña cambiada. Entra con la nueva.",
  correo: "Correo actualizado. Entra con el correo nuevo.",
};

// Si ya hay sesión OWNER vigente, no mostramos el login.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; aviso?: string }>;
}) {
  // Se valida igual que en el panel (no solo la cookie): una sesión vieja, de
  // antes de cambiar la contraseña, debe ver el formulario y no rebotar.
  if (await getOwnerSession()) {
    redirect("/admin");
  }

  const { error, aviso } = await searchParams;
  const notice = aviso ? AVISOS[aviso] : undefined;

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/admin",
      });
    } catch (err) {
      // signIn lanza un redirect interno (NEXT_REDIRECT) en éxito: hay que
      // relanzarlo. Solo tratamos los AuthError como credenciales inválidas.
      if (err instanceof AuthError) {
        redirect("/admin/login?error=1");
      }
      throw err;
    }
  }

  return (
    <AuthShell icon={Lock} title="Pollos Juacost" subtitle="Panel privado del dueño">
      {error ? (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          <AlertCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
          Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.
        </p>
      ) : notice ? (
        <p role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
          <CheckCircle2 aria-hidden size={16} className="mt-0.5 shrink-0" />
          {notice}
        </p>
      ) : null}

      <form action={authenticate} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-neutral-300">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={error ? true : undefined}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-neutral-300">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            className="field"
          />
        </div>
        <SubmitButton pendingText="Entrando…" className="btn btn-primary w-full">
          Entrar
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link href="/admin/recuperar" className="rounded text-orange-300 underline underline-offset-4">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </AuthShell>
  );
}
