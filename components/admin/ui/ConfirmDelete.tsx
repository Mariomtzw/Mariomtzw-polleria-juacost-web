"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Botón de borrar en dos pasos: el primer clic pregunta "¿Eliminar?" y el
 * segundo borra. Si no se confirma en 4 segundos (o el foco sale), se cancela.
 * Es el mismo <button> en ambos pasos para no perder el foco del teclado.
 */
export function ConfirmDelete({
  label,
  onConfirm,
  disabled = false,
}: {
  /** Qué se borra, p. ej. "Eliminar pechuga de Local Laura". */
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={armed ? `Confirmar: ${label}` : label}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
      className={armed ? "btn btn-sm btn-danger" : "btn btn-sm btn-icon btn-ghost"}
    >
      <Trash2 aria-hidden size={14} />
      {armed ? "¿Eliminar?" : null}
    </button>
  );
}
