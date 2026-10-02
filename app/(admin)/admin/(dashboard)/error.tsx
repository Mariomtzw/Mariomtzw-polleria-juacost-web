"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

// Si una pantalla del panel falla al cargar (por ejemplo, sin conexión con la
// base de datos), se muestra este aviso en lugar de una página en blanco.
export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="material mx-auto mt-10 max-w-md rounded-3xl p-6 text-center">
      <h1 className="text-lg font-semibold text-white">No se pudo cargar esta pantalla</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Suele ser un problema temporal de conexión con la base de datos. Tus datos guardados no se pierden.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-5">
        <RotateCcw aria-hidden size={16} /> Reintentar
      </button>
      {error.digest ? <p className="mt-4 text-xs text-neutral-400">Código: {error.digest}</p> : null}
    </div>
  );
}
