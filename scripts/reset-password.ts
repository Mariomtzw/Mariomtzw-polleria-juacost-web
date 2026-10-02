/**
 * Restablecer la contraseña del dueño desde la computadora (salida de emergencia).
 *
 * Úsalo cuando el dueño olvidó su contraseña y el correo de recuperación no
 * está configurado o no le llega. Genera una contraseña temporal, la guarda y
 * la muestra UNA vez; el dueño entra con ella y la cambia en "Mi cuenta".
 *
 * Uso (desde la carpeta del proyecto, con el .env de la base de datos):
 *   npm run password:reset -- correo@ejemplo.com
 *
 * Cierra todas las sesiones abiertas de ese usuario.
 */
import { randomInt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import bcrypt from "bcryptjs";

// Las variables se cargan ANTES de importar Prisma (por eso el import dinámico de abajo).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // El archivo es opcional.
  }
}

/** Sin caracteres que se confunden al dictarlos o copiarlos (0/O, 1/l/I). */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function temporaryPassword(): string {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return [group(), group(), group(), group()].join("-"); // 16 caracteres al azar ≈ 79 bits
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Uso: npm run password:reset -- correo@ejemplo.com");
    process.exit(1);
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user) {
      console.error(`No existe un usuario con el correo ${email}.`);
      process.exitCode = 1;
      return;
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(
      `Se pondrá una contraseña temporal a ${user.email} (${user.role}${user.isActive ? "" : ", desactivado"}) y se cerrarán sus sesiones.\nEscribe SI para continuar: `,
    );
    rl.close();
    if (answer.trim().toUpperCase() !== "SI") {
      console.log("Cancelado. No se cambió nada.");
      return;
    }

    const password = temporaryPassword();
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "PASSWORD_RESET_CLI" } });

    console.log(`\n✓ Contraseña temporal de ${user.email}:\n\n    ${password}\n`);
    console.log("Entrégala por un medio seguro. Al entrar, cámbiala en Mi cuenta → Cambiar contraseña.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
