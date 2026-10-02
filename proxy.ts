import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Next.js 16.3 renombró "middleware" a "proxy". Instanciamos Auth.js SOLO con la
// config edge-safe (sin Prisma) y exportamos la función como default.
const { auth } = NextAuth(authConfig);
export default auth;

// Solo intercepta el módulo privado; el sitio público queda intacto.
export const config = {
  matcher: ["/admin/:path*"],
};
