import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Augmentación de tipos: añade `role` a User, Session y JWT.
// (import type => se borra en build, no contamina el bundle del Edge)
// `pv` es la huella de la contraseña con la que se inició la sesión
// (ver passwordVersion en lib/account/tokens.ts).

declare module "next-auth" {
  interface User {
    role: Role;
    pv?: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      pv?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    pv?: string;
  }
}
