import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Lock } from "lucide-react";
import { auth, signIn } from "@/auth";

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
    <main className="admin flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-500/20 p-2 text-orange-400">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Pollos Juacost</h1>
            <p className="text-xs text-neutral-400">Panel privado del dueño</p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
            Credenciales inválidas o sin permiso.
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
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
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
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-500 px-3 py-2 font-medium text-neutral-950 transition hover:bg-orange-400"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
