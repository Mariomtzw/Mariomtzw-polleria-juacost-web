import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, KeyRound } from "lucide-react";
import { checkResetLink } from "@/lib/actions/account";
import { AuthShell } from "@/components/admin/account/AuthShell";
import { ResetForm } from "@/components/admin/account/ResetForm";

export const metadata: Metadata = {
  title: "Contraseña nueva",
  // El enlace lleva un código secreto: no debe viajar como "referer" a otros sitios.
  referrer: "no-referrer",
};

// Pantalla pública (sin sesión): se llega desde el enlace del correo.
export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const status = await checkResetLink(token);

  return (
    <AuthShell
      icon={KeyRound}
      title="Contraseña nueva"
      subtitle="Panel privado del dueño"
      back={{ href: "/admin/login", label: "Volver a entrar" }}
    >
      {status === "ok" ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-5">
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
            <AlertCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
            {status === "expired"
              ? "Este enlace ya venció. Los enlaces duran 30 minutos."
              : "Este enlace no es válido o ya se usó."}
          </p>
          <Link href="/admin/recuperar" className="btn btn-primary w-full">
            Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
