"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botón de envío que se desactiva y cambia de texto mientras el formulario se procesa. */
export function SubmitButton({
  children,
  pendingText,
  className = "btn btn-primary",
}: {
  children: ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
