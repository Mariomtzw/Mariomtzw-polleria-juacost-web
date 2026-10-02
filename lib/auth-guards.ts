import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Capa 2/3 de seguridad. Úsalo al inicio de layouts, páginas de servidor
 * y Server Actions del panel. Si no hay sesión OWNER, redirige al login.
 *
 * Devuelve la sesión ya validada (con role === "OWNER").
 */
export async function requireOwner(): Promise<Session> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Variante para mutaciones (Server Actions) donde prefieres lanzar un error
 * en vez de redirigir. Nunca confíes en que la UI ocultó el botón: revalida.
 */
export async function assertOwner(): Promise<Session> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    throw new Error("No autorizado: se requiere rol OWNER.");
  }
  return session;
}
