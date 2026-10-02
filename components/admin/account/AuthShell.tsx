import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

/**
 * Marco común de las pantallas sin sesión: entrar, recuperar y restablecer.
 * Una tarjeta centrada con icono, título y, debajo, un enlace de regreso.
 */
export function AuthShell({
  icon: Icon,
  title,
  subtitle,
  children,
  back = { href: "/", label: "Volver al sitio" },
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <main className="admin flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div className="material w-full max-w-sm rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-500/20 p-2 text-orange-400">
            <Icon aria-hidden size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <p className="text-xs text-neutral-400">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>

      <Link href={back.href} className="btn btn-ghost">
        <ArrowLeft aria-hidden size={16} /> {back.label}
      </Link>
    </main>
  );
}
