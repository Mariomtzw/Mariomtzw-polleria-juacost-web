"use server";

import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signOut } from "@/auth";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { mailConfigured, passwordResetMail, sendMail, testMail } from "@/lib/mail";
import { passwordProblem } from "@/lib/account/password-policy";
import {
  RESET_TOKEN_TTL_MS,
  createResetToken,
  parseResetToken,
  resetSecret,
  verifyResetToken,
} from "@/lib/account/tokens";

export type AccountResult = { ok: true; message: string } | { ok: false; error: string };

const BCRYPT_ROUNDS = 12;
const RESET_MINUTES = RESET_TOKEN_TTL_MS / 60_000;
/** Como mucho 3 correos de recuperación por usuario cada 15 minutos. */
const RESET_WINDOW_MS = 15 * 60 * 1000;
const RESET_MAX_PER_WINDOW = 3;

const emailSchema = z.string().trim().toLowerCase().email("Escribe un correo válido.").max(254);
const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

/* ───────────────────────── Sin sesión: olvidé mi contraseña ───────────────────────── */

/**
 * Paso 1: pedir el enlace. Es una acción PÚBLICA (no hay sesión: el dueño
 * olvidó su contraseña), por eso NO llama a assertOwner().
 *
 * Siempre responde lo mismo, exista o no el correo, para no revelar qué
 * correos tienen cuenta. El envío ocurre después de responder (`after`), así
 * tampoco se nota por el tiempo de respuesta.
 */
export async function requestPasswordReset(form: FormData): Promise<AccountResult> {
  const parsed = emailSchema.safeParse(str(form, "email"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Correo inválido." };
  const email = parsed.data;

  if (!mailConfigured() && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error: "La recuperación por correo todavía no está configurada. Pide a quien administra el sitio que restablezca tu contraseña.",
    };
  }

  after(async () => {
    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, email: true, passwordHash: true, isActive: true, role: true },
      });
      if (!user || !user.isActive || user.role !== "OWNER") return;

      const recent = await prisma.auditLog.count({
        where: { userId: user.id, action: "PASSWORD_RESET_REQUEST", createdAt: { gte: new Date(Date.now() - RESET_WINDOW_MS) } },
      });
      if (recent >= RESET_MAX_PER_WINDOW) return;

      const token = createResetToken({ userId: user.id, passwordHash: user.passwordHash, secret: resetSecret() });
      const link = `${appUrl()}/admin/restablecer?token=${encodeURIComponent(token)}`;
      const result = await sendMail(passwordResetMail(user.email, link, RESET_MINUTES));

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_REQUEST",
          meta: result.ok ? { sent: true } : { sent: false, reason: result.reason, detail: result.detail },
        },
      });
      if (!result.ok) console.error(`[recuperar contraseña] No se pudo enviar el correo: ${result.reason} ${result.detail}`);
    } catch (err) {
      console.error("[recuperar contraseña]", err);
    }
  });

  return {
    ok: true,
    message: `Si ese correo tiene una cuenta, en unos minutos recibirá un enlace para elegir una contraseña nueva. Vence en ${RESET_MINUTES} minutos. Revisa también la carpeta de spam.`,
  };
}

export type ResetLinkStatus = "ok" | "expired" | "invalid";

/** Revisa un enlace de recuperación (para mostrar el formulario o el aviso de vencido). */
export async function checkResetLink(token: string): Promise<ResetLinkStatus> {
  const parsed = parseResetToken(token);
  if (!parsed) return "invalid";
  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { passwordHash: true, isActive: true, role: true },
  });
  if (!user || !user.isActive || user.role !== "OWNER") return "invalid";
  return verifyResetToken({ token, passwordHash: user.passwordHash, secret: resetSecret() });
}

/**
 * Paso 2: poner la contraseña nueva con el enlace. Acción PÚBLICA: la prueba de
 * identidad es el enlace firmado, que solo llega al correo del dueño.
 */
export async function resetPassword(form: FormData): Promise<AccountResult> {
  const token = str(form, "token");
  const password = str(form, "password");
  const confirm = str(form, "confirm");

  const parsed = parseResetToken(token);
  const user = parsed
    ? await prisma.user.findUnique({
        where: { id: parsed.userId },
        select: { id: true, email: true, passwordHash: true, isActive: true, role: true },
      })
    : null;
  const status =
    user && user.isActive && user.role === "OWNER"
      ? verifyResetToken({ token, passwordHash: user.passwordHash, secret: resetSecret() })
      : "invalid";
  if (!user || status !== "ok") {
    return {
      ok: false,
      error: status === "expired" ? "El enlace ya venció. Pide uno nuevo." : "El enlace no es válido o ya se usó. Pide uno nuevo.",
    };
  }

  if (password !== confirm) return { ok: false, error: "Las dos contraseñas no coinciden." };
  const problem = passwordProblem(password, user.email);
  if (problem) return { ok: false, error: problem };

  // Al cambiar el hash, este enlace (y cualquier otro pendiente) deja de servir
  // y las sesiones abiertas con la contraseña anterior se cierran.
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "PASSWORD_RESET" } });

  return { ok: true, message: "Contraseña actualizada. Ya puedes entrar con la nueva." };
}

/* ───────────────────────── Con sesión: Mi cuenta ───────────────────────── */

async function currentUser() {
  const session = await assertOwner();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) throw new Error("No autorizado: se requiere rol OWNER.");
  return user;
}

/** Cambia la contraseña sabiendo la actual. Al terminar cierra la sesión. */
export async function changePassword(form: FormData): Promise<AccountResult> {
  const user = await currentUser();
  const current = str(form, "current");
  const password = str(form, "password");
  const confirm = str(form, "confirm");

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }
  if (password !== confirm) return { ok: false, error: "Las dos contraseñas nuevas no coinciden." };
  if (password === current) return { ok: false, error: "La contraseña nueva debe ser distinta de la actual." };
  const problem = passwordProblem(password, user.email);
  if (problem) return { ok: false, error: problem };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "PASSWORD_CHANGE" } });

  // La sesión actual quedó ligada a la contraseña anterior: se cierra y se
  // vuelve a entrar con la nueva (signOut redirige; no regresa).
  await signOut({ redirectTo: "/admin/login?aviso=cambiada" });
  return { ok: true, message: "Contraseña actualizada." };
}

/** Cambia el correo de acceso (pide la contraseña actual). Al terminar cierra la sesión. */
export async function changeEmail(form: FormData): Promise<AccountResult> {
  const user = await currentUser();
  const parsed = emailSchema.safeParse(str(form, "email"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Correo inválido." };
  const email = parsed.data;

  if (!(await bcrypt.compare(str(form, "current"), user.passwordHash))) {
    return { ok: false, error: "La contraseña no es correcta." };
  }
  if (email === user.email.toLowerCase()) return { ok: false, error: "Ese ya es tu correo de acceso." };
  if (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } })) {
    return { ok: false, error: "Ese correo ya está en uso." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { email } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "EMAIL_CHANGE" } });

  await signOut({ redirectTo: "/admin/login?aviso=correo" });
  return { ok: true, message: "Correo actualizado." };
}

/** Envía un correo de prueba al correo de acceso y dice si salió o por qué no. */
export async function sendTestEmail(): Promise<AccountResult> {
  const user = await currentUser();
  if (!mailConfigured() && process.env.NODE_ENV === "production") {
    return { ok: false, error: "Falta configurar RESEND_API_KEY en Vercel." };
  }
  const result = await sendMail(testMail(user.email));
  if (result.ok) return { ok: true, message: `Correo de prueba enviado a ${user.email}. Si no llega en unos minutos, revisa spam.` };
  return { ok: false, error: `No se pudo enviar: ${result.detail}` };
}
