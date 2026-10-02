"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { importFromUpload } from "@/lib/actions/import";
import type { ImportSummary } from "@/lib/import/importSales";

// Reutiliza el parser de la Fase 3 vía el server action importFromUpload.
export function ExcelUpload() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<
    | { type: "ok"; summary: ImportSummary }
    | { type: "error"; text: string }
    | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = await importFromUpload(formData);
      if (res.ok && res.data) setMsg({ type: "ok", summary: res.data });
      else setMsg({ type: "error", text: res.ok ? "Sin datos" : res.error });
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 text-neutral-200">
        <UploadCloud size={18} />
        <h3 className="font-medium">Importar Excel del día</h3>
      </div>
      <p className="mb-4 text-sm text-neutral-400">
        Sube tu archivo <code>Pollos Juacost.xlsx</code>. Se importa (o actualiza)
        el día sin duplicar.
      </p>

      <form action={onSubmit} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".xlsx"
          required
          className="text-sm text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-950 hover:file:bg-orange-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
        >
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>

      {msg?.type === "ok" ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 size={16} className="mt-0.5" />
          <span>
            {msg.summary.date}: {msg.summary.created} creados, {msg.summary.updated}{" "}
            actualizados
            {msg.summary.skipped.length > 0
              ? `, ${msg.summary.skipped.length} omitidos`
              : ""}
            .
          </span>
        </div>
      ) : null}
      {msg?.type === "error" ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{msg.text}</span>
        </div>
      ) : null}
    </div>
  );
}
