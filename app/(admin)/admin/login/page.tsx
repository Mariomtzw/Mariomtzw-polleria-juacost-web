import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { auth, signIn } from "@/auth";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

export const metadata: Metadata = { title: "Entrar" };

// Si ya hay sesión OWNER, no mostramos el login.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role === "OWNER") {
    redirect("/admin");
  }

  const { error } = await searchParams;

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
    <main className="admin flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div className="material w-full max-w-sm rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-500/20 p-2 text-orange-400">
            <Lock aria-hidden size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Pollos Juacost</h1>
            <p className="text-xs text-neutral-400">Panel privado del dueño</p>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
            <AlertCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
            Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.
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
      </div>

      <Link href="/" className="btn btn-ghost">
        <ArrowLeft aria-hidden size={16} /> Volver al sitio
      </Link>
    </main>
  );
}
