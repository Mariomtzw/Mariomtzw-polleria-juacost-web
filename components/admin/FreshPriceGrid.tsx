"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { setFreshPrices } from "@/lib/actions/prices";
import type { FreshPriceBranch } from "@/lib/queries/prices";

const COLS: Array<{ key: keyof NonNullable<FreshPriceBranch["prices"]>; label: string }> = [
  { key: "precioPechuga", label: "Pechuga" },
  { key: "precioPierna", label: "Pierna" },
  { key: "precioAla", label: "Ala" },
  { key: "precioHuacal", label: "Huacal" },
  { key: "precioRabadilla", label: "Rabadilla" },
  { key: "precioHigado", label: "Hígado" },
  { key: "precioPata", label: "Pata" },
  { key: "precioCabeza", label: "Cabeza" },
];

type RowState = Record<string, string>;

// precioPorPieza = pechuga + 2·pierna + 2·ala + huacal + rabadilla + higado + 2·pata + cabeza
function polloEntero(r: RowState): number {
  const n = (k: string) => parseFloat(r[k]) || 0;
  return n("precioPechuga") + 2 * n("precioPierna") + 2 * n("precioAla") + n("precioHuacal") +
    n("precioRabadilla") + n("precioHigado") + 2 * n("precioPata") + n("precioCabeza");
}

export function FreshPriceGrid({ data }: { data: FreshPriceBranch[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const b of data) {
      const s: RowState = {};
      for (const c of COLS) s[c.key] = b.prices ? String(b.prices[c.key]) : "";
      init[b.branchId] = s;
    }
    return init;
  });

  const setCell = (branchId: string, key: string, v: string) =>
    setRows((prev) => ({ ...prev, [branchId]: { ...prev[branchId], [key]: v } }));

  const saveRow = (branchId: string) => {
    setMsg(null); setSavingId(branchId);
    start(async () => {
      const r = rows[branchId];
      const payload: Record<string, unknown> = { branchId };
      for (const c of COLS) payload[c.key] = parseFloat(r[c.key]) || 0;
      const res = await setFreshPrices(payload);
      setSavingId(null);
      if (res.ok) { router.refresh(); setMsg({ ok: true, text: "Precios actualizados." }); }
      else setMsg({ ok: false, text: res.error });
    });
  };

  const input = "w-16 rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none focus:border-orange-500 tabular-nums text-right";

  return (
    <div className="space-y-3">
      {msg ? (
        <span className={`flex items-center gap-1.5 text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{msg.text}
        </span>
      ) : null}
      <div className="overflow-x-auto rounded-3xl material p-2">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-3 py-3 font-medium">Puesto</th>
              {COLS.map((c) => <th key={c.key} className="px-2 py-3 text-right font-medium">{c.label}</th>)}
              <th className="px-2 py-3 text-right font-medium text-orange-300">Pollo entero</th>
              <th className="px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => {
              const r = rows[b.branchId];
              return (
                <tr key={b.branchId} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-200">{b.name}</td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-2 py-2 text-right">
                      <input type="number" min="0" step="0.5" value={r[c.key]} onChange={(e) => setCell(b.branchId, c.key, e.target.value)} className={input} />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-semibold tabular-nums text-orange-300">{polloEntero(r).toFixed(1)}</td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => saveRow(b.branchId)} disabled={pending && savingId === b.branchId} className="press inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50">
                      <Save size={13} /> {pending && savingId === b.branchId ? "…" : "Guardar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">Guardar crea una nueva versión de precios (con fecha de hoy) para ese puesto; el historial anterior se conserva.</p>
    </div>
  );
}
