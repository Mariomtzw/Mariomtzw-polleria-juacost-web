"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { upsertDailySale } from "@/lib/actions/sales";

interface Option {
  id: string;
  name: string;
}

// Formulario de captura de venta diaria. Los 8 precios son opcionales: si se
// dejan vacíos, el server action usa la lista de precios vigente del puesto.
export function DailySaleForm({
  branches,
  sellers,
}: {
  branches: Option[];
  sellers: Option[];
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPrices, setShowPrices] = useState(false);

  function onSubmit(formData: FormData) {
    setMsg(null);

    // Construimos el objeto con `precios` anidado; omitimos precios vacíos para
    // que el server action tome la lista vigente en vez de recibir ceros.
    const str = (k: string) => {
      const v = formData.get(k);
      return typeof v === "string" ? v : "";
    };
    const precios: Record<string, number> = {};
    for (const [name] of pieceFields) {
      const v = str(name);
      if (v.trim() !== "") precios[name] = Number(v);
    }

    const input: Record<string, unknown> = {
      date: str("date"),
      branchId: str("branchId"),
      sellerId: str("sellerId"),
      pollosAsignados: str("pollosAsignados"),
      valorEstimado: str("valorEstimado"),
      vendidoReal: str("vendidoReal"),
    };
    if (Object.keys(precios).length > 0) input.precios = precios;

    startTransition(async () => {
      const res = await upsertDailySale(input);
      setMsg(res.ok ? { ok: true, text: "Venta guardada." } : { ok: false, text: res.error });
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const field =
    "w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500";
  const label = "mb-1 block text-xs text-neutral-400";

  const pieceFields: Array<[string, string]> = [
    ["precioPechuga", "Pechuga"],
    ["precioPierna", "Pierna"],
    ["precioAla", "Ala"],
    ["precioHuacal", "Huacal"],
    ["precioRabadilla", "Rabadilla"],
    ["precioHigado", "Hígado"],
    ["precioPata", "Pata"],
    ["precioCabeza", "Cabeza"],
  ];

  return (
    <form action={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h3 className="mb-4 font-medium text-white">Registrar venta diaria</h3>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div>
          <label className={label} htmlFor="date">Fecha</label>
          <input id="date" name="date" type="date" defaultValue={today} required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="branchId">Puesto</label>
          <select id="branchId" name="branchId" required className={field} defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="sellerId">Vendedora (confirmar)</label>
          <select id="sellerId" name="sellerId" required className={field} defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="pollosAsignados">Pollos asignados</label>
          <input id="pollosAsignados" name="pollosAsignados" type="number" step="0.01" min="0" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="valorEstimado">Valor estimado</label>
          <input id="valorEstimado" name="valorEstimado" type="number" step="0.01" min="0" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="vendidoReal">Vendido real</label>
          <input id="vendidoReal" name="vendidoReal" type="number" step="0.01" min="0" required className={field} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPrices((v) => !v)}
        className="mt-4 text-xs text-orange-400 hover:underline"
      >
        {showPrices ? "Usar precios vigentes del puesto" : "Ajustar los 8 precios manualmente"}
      </button>

      {showPrices ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {pieceFields.map(([name, lbl]) => (
            <div key={name}>
              <label className={label} htmlFor={name}>{lbl}</label>
              <input id={name} name={name} type="number" step="0.01" min="0" className={field} />
            </div>
          ))}
          <p className="col-span-full text-[11px] text-neutral-500">
            Deja vacío para tomar el precio vigente. Se guarda snapshot en el registro.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50"
        >
          <Save size={16} /> {pending ? "Guardando…" : "Guardar"}
        </button>
        {msg ? (
          <span className={msg.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>{msg.text}</span>
        ) : null}
      </div>
    </form>
  );
}
