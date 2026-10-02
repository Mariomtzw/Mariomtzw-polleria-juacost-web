"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Campo de contraseña con botón para verla. Poder leer lo que se escribió
 * evita errores al teclear, sobre todo en el teléfono.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  hint,
  invalid,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-neutral-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={hintId}
          aria-invalid={invalid ? true : undefined}
          className="field pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="btn btn-sm btn-icon btn-ghost absolute right-1 top-1/2 -translate-y-1/2"
        >
          {visible ? <EyeOff aria-hidden size={16} /> : <Eye aria-hidden size={16} />}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-neutral-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
