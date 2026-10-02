"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { createOrder } from "@/lib/actions/orders";

interface Option {
  id: string;
  name: string;
}

// Pedido por puesto.
export function OrderForm({ branches }: { branches: Option[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = await createOrder(formData);
      setMsg(res.ok ? { ok: true, text: "Pedido guardado." } : { ok: false, text: res.error });
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const field =
    "w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500";
  const label = "mb-1 block text-xs text-neutral-400";

  return (
    <form action={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h3 className="mb-4 font-medium text-white">Registrar pedido</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className={label} htmlFor="o-date">Fecha</label>
          <input id="o-date" name="date" type="date" defaultValue={today} required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="o-branch">Puesto</label>
          <select id="o-branch" name="branchId" required className={field} defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="o-amount">Monto</label>
          <input id="o-amount" name="amount" type="number" step="0.01" min="0" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="o-qty">Pollos (opcional)</label>
          <input id="o-qty" name="quantity" type="number" step="1" min="0" className={field} />
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className={label} htmlFor="o-notes">Notas (opcional)</label>
          <input id="o-notes" name="notes" type="text" maxLength={500} className={field} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50">
          <Save size={16} /> {pending ? "Guardando…" : "Guardar"}
        </button>
        {msg ? <span className={msg.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>{msg.text}</span> : null}
      </div>
    </form>
  );
}
