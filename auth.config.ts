import type { NextAuthConfig } from "next-auth";

/**
 * Configuración "edge-safe": NO importa Prisma ni bcryptjs.
 * La usa el middleware (Edge Runtime) para validar sesión y rol
 * sin tocar la base de datos. Los proveedores (Credentials) se
 * añaden en `auth.ts`, que sí corre en Node.
 */
/** Rutas de /admin que se pueden abrir sin sesión. */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/recuperar", "/admin/restablecer"];

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    /**
     * Capa 1 de seguridad (middleware). Controla el acceso a /admin/*.
     * Solo el rol OWNER puede entrar; el login y la recuperación quedan libres.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOwner = auth?.user?.role === "OWNER";
      const path = nextUrl.pathname;

      const isAdminArea = path.startsWith("/admin");

      // Entrar y recuperar la contraseña siempre son accesibles (no hay sesión todavía).
      if (PUBLIC_ADMIN_PATHS.includes(path)) return true;

      // Todo lo demás dentro de /admin exige sesión OWNER.
      if (isAdminArea) return isLoggedIn && isOwner;

      // Rutas públicas (landing, recetas, etc.): sin restricción.
      return true;
    },

    // Propaga el rol al JWT (para que el middleware lo lea sin DB).
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.pv = user.pv;
      }
      return token;
    },

    // Expone el rol en la sesión del lado servidor/cliente.
    session({ session, token }) {
      // El token llega sin tipo: solo se copia si es uno de los roles válidos.
      if (session.user && (token.role === "OWNER" || token.role === "STAFF")) {
        session.user.role = token.role;
      }
      // Id y huella de contraseña: los usa lib/auth-guards.ts para revalidar
      // la sesión contra la base de datos.
      if (session.user && typeof token.sub === "string") session.user.id = token.sub;
      if (session.user && typeof token.pv === "string") session.user.pv = token.pv;
      return session;
    },
  },
  providers: [], // se completan en auth.ts (Credentials)
} satisfies NextAuthConfig;
