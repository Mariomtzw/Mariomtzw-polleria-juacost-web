import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Resultado de una acción (guardado o error). Se anuncia a lectores de
 * pantalla: los errores con role="alert" y los avisos con role="status".
 */
export function Notice({ ok, children, className = "" }: { ok: boolean; children: ReactNode; className?: string }) {
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-1.5 text-sm ${ok ? "text-emerald-300" : "text-red-300"} ${className}`}
    >
      <Icon aria-hidden size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
