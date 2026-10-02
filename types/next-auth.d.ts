import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Augmentación de tipos: añade `role` a User, Session y JWT.
// (import type => se borra en build, no contamina el bundle del Edge)

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
