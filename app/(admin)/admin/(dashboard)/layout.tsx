import { requireOwner } from "@/lib/auth-guards";
import { signOut } from "@/auth";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";

// Layout privado con sidebar. Capa 2 de seguridad: revalida OWNER en servidor.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOwner();

  return (
    <div className="admin flex min-h-dvh text-neutral-100">
      <a
        href="#contenido"
        className="btn btn-primary fixed left-3 top-3 z-[60] -translate-y-20 focus-visible:translate-y-0"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior fija: en el teléfono el botón de menú queda sobre ella y no encima del contenido */}
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-end gap-3 border-b border-white/10 bg-neutral-950/85 py-2 pl-16 pr-4 backdrop-blur-md md:px-6">
          <Link
            href="/admin/cuenta"
            title="Mi cuenta"
            className="min-w-0 truncate rounded text-xs text-neutral-400 underline-offset-4 hover:text-white hover:underline"
          >
            <span className="sr-only">Mi cuenta: </span>
            {session.user?.email}
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="btn btn-secondary">
              <LogOut aria-hidden size={16} /> Salir
            </button>
          </form>
        </header>
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
