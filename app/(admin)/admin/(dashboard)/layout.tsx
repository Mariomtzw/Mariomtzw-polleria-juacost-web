import { requireOwner } from "@/lib/auth-guards";
import { signOut } from "@/auth";
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
    <div className="admin flex min-h-screen bg-neutral-950 text-neutral-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-white/10 px-6 py-3">
          <span className="text-xs text-neutral-400">{session.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5"
            >
              <LogOut size={16} /> Salir
            </button>
          </form>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
