import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { passwordVersion } from "@/lib/account/tokens";
import type { Session } from "next-auth";

/**
 * Sesión del dueño, revalidada contra la base de datos. Devuelve `null` si:
 *  - no hay sesión o el rol no es OWNER;
 *  - el usuario ya no existe, está desactivado o dejó de ser OWNER;
 *  - la contraseña cambió después de iniciar esta sesión (la sesión guarda la
 *    huella `pv` de la contraseña con la que se entró).
 *
 * El último punto es lo que hace que "cambiar la contraseña" cierre las demás
 * sesiones abiertas: la cookie (JWT) no se puede revocar, pero deja de aceptarse.
 *
 * `cache` de React: una sola consulta por petición aunque lo llamen el layout,
 * la página y varios componentes.
 */
export const getOwnerSession = cache(async (): Promise<Session | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user || user.role !== "OWNER" || !user.id) return null;

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, isActive: true, role: true },
  });
  if (!row || !row.isActive || row.role !== "OWNER") return null;
  if (!user.pv || user.pv !== passwordVersion(row.passwordHash)) return null;

  return session;
});

/**
 * Capa 2/3 de seguridad. Úsalo al inicio de layouts, páginas de servidor
 * y Server Actions del panel. Si no hay sesión OWNER vigente, redirige al login.
 *
 * Devuelve la sesión ya validada (con role === "OWNER").
 */
export async function requireOwner(): Promise<Session> {
  const session = await getOwnerSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Variante para mutaciones (Server Actions) donde prefieres lanzar un error
 * en vez de redirigir. Nunca confíes en que la UI ocultó el botón: revalida.
 */
export async function assertOwner(): Promise<Session> {
  const session = await getOwnerSession();
  if (!session) {
    throw new Error("No autorizado: se requiere rol OWNER.");
  }
  return session;
}
