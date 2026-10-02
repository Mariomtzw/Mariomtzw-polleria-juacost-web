"use client";

import { useState, useTransition, type FormEvent } from "react";
import { KeyRound, Mail, Send } from "lucide-react";
import { changeEmail, changePassword, sendTestEmail, type AccountResult } from "@/lib/actions/account";
import { PASSWORD_HINT, passwordProblem } from "@/lib/account/password-policy";
import { Notice } from "@/components/admin/ui/Notice";
import { PasswordField } from "@/components/admin/account/PasswordField";

type Msg = { ok: boolean; text: string } | null;
const toMsg = (res: AccountResult): Msg => (res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });

/** Cambiar la contraseña sabiendo la actual. Al guardar, el panel cierra la sesión. */
export function ChangePasswordForm({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    // Aviso inmediato; el servidor vuelve a validar todo.
    const problem = password !== form.get("confirm") ? "Las dos contraseñas nuevas no coinciden." : passwordProblem(password, email);
    if (problem) return setMsg({ ok: false, text: problem });

    setMsg(null);
    startTransition(async () => setMsg(toMsg(await changePassword(form))));
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      {/* Campo oculto para que el gestor de contraseñas sepa de qué cuenta es */}
      <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField id="pw-current" name="current" label="Contraseña actual" autoComplete="current-password" />
      <PasswordField id="pw-new" name="password" label="Contraseña nueva" autoComplete="new-password" hint={PASSWORD_HINT} />
      <PasswordField id="pw-confirm" name="confirm" label="Repite la contraseña nueva" autoComplete="new-password" />
      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary">
        <KeyRound aria-hidden size={16} /> {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

/** Cambiar el correo de acceso (pide la contraseña). Al guardar, el panel cierra la sesión. */
export function ChangeEmailForm({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => setMsg(toMsg(await changeEmail(form))));
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <label htmlFor="email-new" className="mb-1 block text-sm text-neutral-300">
          Correo nuevo
        </label>
        <input id="email-new" name="email" type="email" required autoComplete="email" placeholder={email} className="field" />
      </div>
      <PasswordField id="email-current" name="current" label="Tu contraseña (para confirmar)" autoComplete="current-password" />
      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-secondary">
        <Mail aria-hidden size={16} /> {pending ? "Guardando…" : "Cambiar correo"}
      </button>
    </form>
  );
}

/** Envía un correo de prueba para confirmar que la recuperación funcionará el día que haga falta. */
export function TestEmailButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => setMsg(toMsg(await sendTestEmail())));
        }}
        className="btn btn-secondary"
      >
        <Send aria-hidden size={16} /> {pending ? "Enviando…" : "Enviar correo de prueba"}
      </button>
      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}
    </div>
  );
}
