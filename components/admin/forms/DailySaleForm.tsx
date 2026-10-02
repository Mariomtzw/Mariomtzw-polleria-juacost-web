"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { upsertDailySale } from "@/lib/actions/sales";
import { todayISO } from "@/lib/dates";
import { Notice } from "@/components/admin/ui/Notice";

interface Option {
  id: string;
  name: string;
}

const PIECE_FIELDS: Array<[string, string]> = [
  ["precioPechuga", "Pechuga"],
  ["precioPierna", "Pierna"],
  ["precioAla", "Ala"],
  ["precioHuacal", "Huacal"],
  ["precioRabadilla", "Rabadilla"],
  ["precioHigado", "Hígado"],
  ["precioPata", "Pata"],
  ["precioCabeza", "Cabeza"],
];

// Formulario de captura de venta diaria. Los 8 precios son opcionales: si se
// dejan vacíos, el server action usa la lista de precios vigente del puesto.
export function DailySaleForm({
  branches,
  sellers,
}: {
  branches: Option[];
  sellers: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPrices, setShowPrices] = useState(false);

  // Se envía con onSubmit (no con `action`) para que, si el servidor rechaza
  // los datos, lo escrito se quede en pantalla y se pueda corregir.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setMsg(null);

    // Construimos el objeto con `precios` anidado; omitimos precios vacíos para
    // que el server action tome la lista vigente en vez de recibir ceros.
    const str = (k: string) => {
      const v = formData.get(k);
      return typeof v === "string" ? v : "";
    };
    const precios: Record<string, number> = {};
    for (const [name] of PIECE_FIELDS) {
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
      if (res.ok) {
        const date = str("date");
        form.reset();
        const dateInput = form.elements.namedItem("date");
        if (dateInput instanceof HTMLInputElement) dateInput.value = date; // misma fecha para el siguiente puesto
        setMsg({ ok: true, text: "Venta guardada." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="venta-title" className="material rounded-3xl p-5">
      <h2 id="venta-title" className="mb-1 font-medium text-white">Registrar venta diaria</h2>
      <p className="mb-4 text-xs text-neutral-400">
        Para un solo puesto. Si ese puesto ya tiene venta en esa fecha, se reemplaza.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="date">Fecha</label>
          <input id="date" name="date" type="date" defaultValue={todayISO()} required className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="branchId">Puesto</label>
          <select id="branchId" name="branchId" required className="field" defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="sellerId">Vendedora (confirmar)</label>
          <select id="sellerId" name="sellerId" required className="field" defaultValue="">
            <option value="" disabled>Selecciona…</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="pollosAsignados">Pollos asignados</label>
          <input id="pollosAsignados" name="pollosAsignados" type="number" inputMode="decimal" step="0.01" min="0" required className="field field-num" />
        </div>
        <div>
          <label className="field-label" htmlFor="valorEstimado">Valor estimado ($)</label>
          <input id="valorEstimado" name="valorEstimado" type="number" inputMode="decimal" step="0.01" min="0" required className="field field-num" />
        </div>
        <div>
          <label className="field-label" htmlFor="vendidoReal">Vendido real ($)</label>
          <input id="vendidoReal" name="vendidoReal" type="number" inputMode="decimal" step="0.01" min="0" required className="field field-num" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPrices((v) => !v)}
        aria-expanded={showPrices}
        aria-controls="venta-precios"
        className="mt-4 rounded text-sm text-orange-300 underline underline-offset-4"
      >
        {showPrices ? "Usar precios vigentes del puesto" : "Ajustar los 8 precios manualmente"}
      </button>

      <div id="venta-precios" hidden={!showPrices} className="mt-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PIECE_FIELDS.map(([name, lbl]) => (
            <div key={name}>
              <label className="field-label" htmlFor={name}>{lbl}</label>
              <input id={name} name={name} type="number" inputMode="decimal" step="0.01" min="0" disabled={!showPrices} className="field field-num" />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Deja vacío para tomar el precio vigente. Los precios usados se guardan junto con la venta.
        </p>
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
