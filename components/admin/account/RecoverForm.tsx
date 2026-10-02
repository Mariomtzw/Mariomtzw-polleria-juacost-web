"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Send } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/account";
import { Notice } from "@/components/admin/ui/Notice";

/** Paso 1 de "olvidé mi contraseña": pedir el enlace por correo. */
export function RecoverForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await requestPasswordReset(form);
      if (res.ok) setSent(res.message);
      else setError(res.error);
    });
  }

  if (sent) {
    return <Notice ok>{sent}</Notice>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-neutral-300">
        Escribe el correo con el que entras al panel. Te enviaremos un enlace para elegir una contraseña nueva.
      </p>
      <div>
        <label htmlFor="recover-email" className="mb-1 block text-sm text-neutral-300">
          Correo
        </label>
        <input id="recover-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      {error ? <Notice ok={false}>{error}</Notice> : null}
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full">
        <Send aria-hidden size={16} /> {pending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}
