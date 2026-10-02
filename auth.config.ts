import type { NextAuthConfig } from "next-auth";

/**
 * Configuración "edge-safe": NO importa Prisma ni bcryptjs.
 * La usa el middleware (Edge Runtime) para validar sesión y rol
 * sin tocar la base de datos. Los proveedores (Credentials) se
 * añaden en `auth.ts`, que sí corre en Node.
 */
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
     * Solo el rol OWNER puede entrar; /admin/login queda libre.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOwner = auth?.user?.role === "OWNER";
      const path = nextUrl.pathname;

      const isLoginPage = path === "/admin/login";
      const isAdminArea = path.startsWith("/admin");

      // La página de login siempre es accesible.
      if (isLoginPage) return true;

      // Todo lo demás dentro de /admin exige sesión OWNER.
      if (isAdminArea) return isLoggedIn && isOwner;

      // Rutas públicas (landing, recetas, etc.): sin restricción.
      return true;
    },

    // Propaga el rol al JWT (para que el middleware lo lea sin DB).
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    // Expone el rol en la sesión del lado servidor/cliente.
    session({ session, token }) {
      // El token llega sin tipo: solo se copia si es uno de los roles válidos.
      if (session.user && (token.role === "OWNER" || token.role === "STAFF")) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [], // se completan en auth.ts (Credentials)
} satisfies NextAuthConfig;
