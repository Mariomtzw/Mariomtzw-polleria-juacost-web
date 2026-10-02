"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { resetPassword } from "@/lib/actions/account";
import { PASSWORD_HINT, passwordProblem } from "@/lib/account/password-policy";
import { Notice } from "@/components/admin/ui/Notice";
import { PasswordField } from "@/components/admin/account/PasswordField";

/** Paso 2 de "olvidé mi contraseña": elegir la contraseña nueva con el enlace del correo. */
export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    // Aviso inmediato; el servidor vuelve a validar todo.
    const problem = password !== form.get("confirm") ? "Las dos contraseñas no coinciden." : passwordProblem(password);
    if (problem) return setError(problem);

    setError(null);
    form.set("token", token);
    startTransition(async () => {
      const res = await resetPassword(form);
      if (res.ok) router.replace("/admin/login?aviso=restablecida");
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField id="reset-password" name="password" label="Contraseña nueva" autoComplete="new-password" hint={PASSWORD_HINT} invalid={Boolean(error)} />
      <PasswordField id="reset-confirm" name="confirm" label="Repite la contraseña nueva" autoComplete="new-password" invalid={Boolean(error)} />
      {error ? <Notice ok={false}>{error}</Notice> : null}
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full">
        <KeyRound aria-hidden size={16} /> {pending ? "Guardando…" : "Guardar contraseña nueva"}
      </button>
    </form>
  );
}
