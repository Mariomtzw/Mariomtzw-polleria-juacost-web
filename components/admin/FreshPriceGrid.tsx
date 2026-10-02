"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { setFreshPrices } from "@/lib/actions/prices";
import type { FreshPriceBranch } from "@/lib/queries/prices";
import { Notice } from "@/components/admin/ui/Notice";

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

const num = (s: string | undefined) => parseFloat(s ?? "") || 0;

// precioPorPieza = pechuga + 2·pierna + 2·ala + huacal + rabadilla + higado + 2·pata + cabeza
function polloEntero(r: RowState): number {
  const n = (k: string) => num(r[k]);
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

  const setCell = (branchId: string, key: string, v: string) => {
    setMsg(null);
    setRows((prev) => ({ ...prev, [branchId]: { ...prev[branchId], [key]: v } }));
  };

  // Solo se puede guardar un puesto cuando alguno de sus precios cambió
  // (cada guardado crea una versión nueva de la lista de precios).
  const changed = (b: FreshPriceBranch) =>
    COLS.some((c) => num(rows[b.branchId][c.key]) !== (b.prices ? b.prices[c.key] : 0));

  const saveRow = (b: FreshPriceBranch) => {
    setMsg(null);
    setSavingId(b.branchId);
    start(async () => {
      const r = rows[b.branchId];
      const payload: Record<string, unknown> = { branchId: b.branchId };
      for (const c of COLS) payload[c.key] = num(r[c.key]);
      const res = await setFreshPrices(payload);
      setSavingId(null);
      if (res.ok) {
        router.refresh();
        setMsg({ ok: true, text: `Precios de ${b.name} actualizados.` });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  };

  return (
    <div className="space-y-3">
      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}
      <div className="material overflow-x-auto rounded-3xl">
        <table className="table min-w-[880px]">
          <caption className="sr-only">Precios de pieza por puesto</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky-col">Puesto</th>
              {COLS.map((c) => (
                <th key={c.key} scope="col" className="num">{c.label}</th>
              ))}
              <th scope="col" className="num text-orange-300">Pollo entero</th>
              <th scope="col"><span className="sr-only">Guardar</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => {
              const r = rows[b.branchId];
              const saving = pending && savingId === b.branchId;
              const isChanged = changed(b);
              return (
                <tr key={b.branchId}>
                  <th scope="row" className="sticky-col whitespace-nowrap text-left font-medium text-neutral-100">
                    {b.name}
                    {isChanged ? <span className="ml-2 text-xs font-normal text-amber-300">sin guardar</span> : null}
                  </th>
                  {COLS.map((c) => (
                    <td key={c.key} className="text-right">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.5"
                        value={r[c.key]}
                        onChange={(e) => setCell(b.branchId, c.key, e.target.value)}
                        aria-label={`${c.label} en ${b.name}`}
                        className="field field-num ml-auto w-[4.5rem] px-2"
                      />
                    </td>
                  ))}
                  <td className="num font-semibold text-orange-300">{polloEntero(r).toFixed(1)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => saveRow(b)}
                      disabled={pending || !isChanged}
                      aria-label={`Guardar precios de ${b.name}`}
                      className="btn btn-sm btn-primary"
                    >
                      <Save aria-hidden size={13} /> {saving ? "Guardando…" : "Guardar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="max-w-[72ch] text-xs text-neutral-400">
        Cambia un precio y pulsa Guardar en ese renglón. Se crea una nueva versión de precios (con fecha de hoy) para ese puesto; el historial anterior se conserva.
      </p>
    </div>
  );
}
