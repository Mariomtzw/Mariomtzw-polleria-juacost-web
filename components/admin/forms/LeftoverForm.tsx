"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createLeftover } from "@/lib/actions/leftovers";
import { todayISO } from "@/lib/dates";
import { Notice } from "@/components/admin/ui/Notice";

interface Option {
  id: string;
  name: string;
}

// Sobrante (merma) por puesto y pieza.
export function LeftoverForm({
  branches,
  pieceTypes,
}: {
  branches: Option[];
  pieceTypes: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // onSubmit (no `action`): si hay un error, lo escrito se conserva.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Un precio vacío significa "sin precio", no cero.
    if (formData.get("unitPrice") === "") formData.delete("unitPrice");
    setMsg(null);
    startTransition(async () => {
      const res = await createLeftover(formData);
      if (res.ok) {
        const date = formData.get("date");
        form.reset();
        const dateInput = form.elements.namedItem("date");
        if (dateInput instanceof HTMLInputElement && typeof date === "string") dateInput.value = date;
        setMsg({ ok: true, text: "Sobrante guardado." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="sobrante-title" className="material rounded-3xl p-5">
      <h2 id="sobrante-title" className="mb-4 font-medium text-white">Registrar sobrante</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="l-date">Fecha</label>
          <input id="l-date" name="date" type="date" defaultValue={todayISO()} required className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="l-branch">Puesto</label>
          <select id="l-branch" name="branchId" required className="field" defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="l-piece">Pieza</label>
          <select id="l-piece" name="pieceTypeId" required className="field" defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {pieceTypes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="l-qty">Cantidad</label>
          <input id="l-qty" name="quantity" type="number" inputMode="decimal" step="0.01" min="0" required className="field field-num" />
        </div>
        <div>
          <label className="field-label" htmlFor="l-price">Precio unitario (opcional)</label>
          <input id="l-price" name="unitPrice" type="number" inputMode="decimal" step="0.01" min="0" className="field field-num" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          <Save aria-hidden size={16} /> {pending ? "Guardando…" : "Guardar"}
        </button>
        {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}
      </div>
    </form>
  );
}
