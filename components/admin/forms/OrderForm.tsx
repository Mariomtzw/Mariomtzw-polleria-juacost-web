"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createOrder } from "@/lib/actions/orders";
import { todayISO } from "@/lib/dates";
import { Notice } from "@/components/admin/ui/Notice";

interface Option {
  id: string;
  name: string;
}

// Pedido por puesto.
export function OrderForm({ branches }: { branches: Option[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // onSubmit (no `action`): si hay un error, lo escrito se conserva.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Los opcionales vacíos se omiten (vacío no es "0 pollos").
    for (const key of ["quantity", "notes"]) if (formData.get(key) === "") formData.delete(key);
    setMsg(null);
    startTransition(async () => {
      const res = await createOrder(formData);
      if (res.ok) {
        const date = formData.get("date");
        form.reset();
        const dateInput = form.elements.namedItem("date");
        if (dateInput instanceof HTMLInputElement && typeof date === "string") dateInput.value = date;
        setMsg({ ok: true, text: "Pedido guardado." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="pedido-title" className="material rounded-3xl p-5">
      <h2 id="pedido-title" className="mb-4 font-medium text-white">Registrar pedido</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="field-label" htmlFor="o-date">Fecha</label>
          <input id="o-date" name="date" type="date" defaultValue={todayISO()} required className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="o-branch">Puesto</label>
          <select id="o-branch" name="branchId" required className="field" defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="o-amount">Monto ($)</label>
          <input id="o-amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0" required className="field field-num" />
        </div>
        <div>
          <label className="field-label" htmlFor="o-qty">Pollos (opcional)</label>
          <input id="o-qty" name="quantity" type="number" inputMode="numeric" step="1" min="0" className="field field-num" />
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className="field-label" htmlFor="o-notes">Notas (opcional)</label>
          <input id="o-notes" name="notes" type="text" maxLength={500} className="field" />
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
