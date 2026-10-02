import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Enlace de "olvidé mi contraseña" SIN tabla en la base de datos.
 *
 * El enlace lleva: id del usuario + hora de vencimiento + firma. La firma se
 * calcula con AUTH_SECRET y con el hash de la contraseña ACTUAL del usuario,
 * así que:
 *  - nadie puede fabricar un enlace sin conocer AUTH_SECRET;
 *  - vence solo (30 minutos);
 *  - es de un solo uso: al cambiar la contraseña cambia el hash y la firma
 *    deja de coincidir (también invalida enlaces anteriores sin usar).
 *
 * Solo corre en Node (usa node:crypto): no lo importes desde auth.config.ts.
 */
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const PURPOSE = "password-reset-v1";

function signature(secret: string, userId: string, expiresAt: number, passwordHash: string): Buffer {
  // Clave derivada: el secreto de sesión nunca firma directamente otro tipo de dato.
  const key = createHmac("sha256", secret).update(PURPOSE).digest();
  return createHmac("sha256", key).update(`${userId}.${expiresAt}.${passwordHash}`).digest();
}

export function createResetToken(input: {
  userId: string;
  passwordHash: string;
  secret: string;
  now?: number;
}): string {
  const expiresAt = (input.now ?? Date.now()) + RESET_TOKEN_TTL_MS;
  const sig = signature(input.secret, input.userId, expiresAt, input.passwordHash);
  return [Buffer.from(input.userId, "utf8").toString("base64url"), expiresAt.toString(36), sig.toString("base64url")].join(".");
}

/** Lee el enlace sin validarlo: sirve para saber a qué usuario buscar. */
export function parseResetToken(token: string): { userId: string; expiresAt: number; sig: string } | null {
  if (typeof token !== "string" || token.length > 512) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idPart, expPart, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(idPart) || !/^[0-9a-z]+$/.test(expPart) || !/^[A-Za-z0-9_-]+$/.test(sig)) return null;
  const userId = Buffer.from(idPart, "base64url").toString("utf8");
  const expiresAt = parseInt(expPart, 36);
  if (!userId || !Number.isSafeInteger(expiresAt)) return null;
  return { userId, expiresAt, sig };
}

export type ResetTokenStatus = "ok" | "expired" | "invalid";

/** Valida el enlace contra el hash de contraseña actual del usuario. */
export function verifyResetToken(input: {
  token: string;
  passwordHash: string;
  secret: string;
  now?: number;
}): ResetTokenStatus {
  const parsed = parseResetToken(input.token);
  if (!parsed) return "invalid";
  const expected = signature(input.secret, parsed.userId, parsed.expiresAt, input.passwordHash);
  const given = Buffer.from(parsed.sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return "invalid";
  // La firma se revisa antes que la fecha: un enlace alterado nunca se reporta como "vencido".
  if ((input.now ?? Date.now()) > parsed.expiresAt) return "expired";
  return "ok";
}

/**
 * Huella corta de la contraseña vigente. Se guarda en la sesión al entrar y se
 * compara en cada petición: si la contraseña cambió, las sesiones abiertas con
 * la anterior dejan de valer.
 */
export function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(`session-v1.${passwordHash}`).digest("base64url").slice(0, 16);
}

/** Secreto del servidor para firmar enlaces. Falla con un mensaje claro si falta. */
export function resetSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET en el entorno.");
  return secret;
}
