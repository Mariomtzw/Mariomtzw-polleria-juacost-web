import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { passwordVersion } from "./lib/account/tokens";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Instancia principal de Auth.js (Node runtime).
 * Aquí sí se usa Prisma + bcryptjs porque este módulo NO corre en el Edge.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Sin distinguir mayúsculas: el teclado del teléfono suele poner la primera en mayúscula.
        const user = await prisma.user.findFirst({
          where: { email: { equals: email.trim(), mode: "insensitive" } },
        });
        if (!user || !user.isActive) return null;

        // Owner-only: aunque el usuario exista, si no es OWNER no entra.
        if (user.role !== "OWNER") return null;

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        // Registro de acceso (auditoría).
        await prisma.auditLog.create({
          data: { userId: user.id, action: "LOGIN" },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          // Huella de la contraseña vigente: si después cambia, esta sesión deja de valer.
          pv: passwordVersion(user.passwordHash),
        };
      },
    }),
  ],
});
