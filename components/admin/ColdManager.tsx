"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Snowflake, ChevronLeft, ChevronRight, CalendarDays, Plus, Save, Trash2, Tag, CheckCircle2, AlertCircle,
} from "lucide-react";
import { distributeCold, saveColdInventory, deleteColdStock, setColdPrices } from "@/lib/actions/cold";
import type { ColdDay, ColdStockRow } from "@/lib/queries/cold";

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function shiftDate(d: string, days: number): string {
  const x = new Date(`${d}T00:00:00`); x.setDate(x.getDate() + days); return x.toISOString().slice(0, 10);
}

const field = "rounded-lg border border-white/10 bg-neutral-900 px-2.5 py-1.5 text-sm text-white outline-none focus:border-orange-500";

export function ColdManager({ data }: { data: ColdDay }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const goto = (d: string) => router.push(`/admin/frio?date=${d}`);
  const run = (fn: () => Promise<{ ok: boolean; text: string }>) => { setMsg(null); start(async () => setMsg(await fn())); };

  // --- Distribuir ---
  const [dBranch, setDBranch] = useState("");
  const [dPiece, setDPiece] = useState("");
  const [dQty, setDQty] = useState("");
  const addDistribution = () =>
    run(async () => {
      const res = await distributeCold({ date: data.date, rows: [{ branchId: dBranch, pieceTypeId: dPiece, quantity: dQty }] });
      if (res.ok) { setDQty(""); router.refresh(); return { ok: true, text: "Frío asignado al puesto." }; }
      return { ok: false, text: res.error };
    });

  // --- Inventario editable ---
  const [rows, setRows] = useState(() =>
    data.stock.map((s) => ({ ...s, up: String(s.unitPrice), sold: String(s.quantitySold) })),
  );
  const setRow = (id: string, k: "up" | "sold", v: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const saveInv = () =>
    run(async () => {
      const res = await saveColdInventory({
        rows: rows.map((r) => ({ id: r.id, unitPrice: parseFloat(r.up) || 0, quantitySold: parseFloat(r.sold) || 0 })),
      });
      if (res.ok) { router.refresh(); return { ok: true, text: "Inventario guardado." }; }
      return { ok: false, text: res.error };
    });
  const delRow = (id: string) =>
    run(async () => { const res = await deleteColdStock(id); if (res.ok) { router.refresh(); return { ok: true, text: "Renglón eliminado." }; } return { ok: false, text: res.error }; });

  const totalIngreso = useMemo(
    () => rows.reduce((a, r) => a + (parseFloat(r.sold) || 0) * (parseFloat(r.up) || 0), 0),
    [rows],
  );

  // --- Precios fríos ---
  const priceMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data.coldPrices) m.set(`${p.branchId}:${p.pieceTypeId}`, p.price);
    return m;
  }, [data.coldPrices]);
  const [pBranch, setPBranch] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const selectPriceBranch = (branchId: string) => {
    setPBranch(branchId);
    const init: Record<string, string> = {};
    for (const pc of data.pieces) { const v = priceMap.get(`${branchId}:${pc.pieceTypeId}`); init[pc.pieceTypeId] = v != null ? String(v) : ""; }
    setPrices(init);
  };
  const savePrices = () =>
    run(async () => {
      const list = data.pieces
        .filter((pc) => prices[pc.pieceTypeId] !== undefined && prices[pc.pieceTypeId] !== "")
        .map((pc) => ({ pieceTypeId: pc.pieceTypeId, price: parseFloat(prices[pc.pieceTypeId]) || 0 }));
      if (!pBranch || list.length === 0) return { ok: false, text: "Elige puesto y captura al menos un precio." };
      const res = await setColdPrices({ branchId: pBranch, prices: list });
      if (res.ok) { router.refresh(); return { ok: true, text: "Precios fríos guardados." }; }
      return { ok: false, text: res.error };
    });

  return (
    <div className="space-y-6">
      {msg ? (
        <span className={`flex items-center gap-1.5 text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{msg.text}
        </span>
      ) : null}

      {/* Sobrante disponible (día anterior) */}
      <div className="material rounded-3xl p-5">
        <h3 className="mb-1 flex items-center gap-2 font-medium text-white"><Snowflake size={16} className="text-sky-400" /> Sobrante disponible (día anterior)</h3>
        <p className="mb-3 text-xs text-neutral-400">Piezas frescas que sobraron ayer y hoy se venden como frío.</p>
        {data.pool.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay sobrante registrado el día anterior.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.pool.map((p) => (
              <span key={p.pieceTypeId} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-200">
                {p.label}: <span className="tabular-nums text-sky-300">{p.quantity}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Distribuir */}
      <div className="material rounded-3xl p-5">
        <h3 className="mb-3 font-medium text-white">Distribuir frío a un puesto</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-xs text-neutral-400">Puesto</label>
            <select value={dBranch} onChange={(e) => setDBranch(e.target.value)} className={field}>
              <option value="">Selecciona…</option>
              {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="mb-1 block text-xs text-neutral-400">Pieza</label>
            <select value={dPiece} onChange={(e) => setDPiece(e.target.value)} className={field}>
              <option value="">Selecciona…</option>
              {data.pieces.map((p) => <option key={p.pieceTypeId} value={p.pieceTypeId}>{p.label}</option>)}
            </select>
          </div>
          <div><label className="mb-1 block text-xs text-neutral-400">Cantidad</label>
            <input type="number" min="0" step="0.5" value={dQty} onChange={(e) => setDQty(e.target.value)} className={`${field} w-24 text-right tabular-nums`} />
          </div>
          <button onClick={addDistribution} disabled={pending || !dBranch || !dPiece || !dQty} className="press inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-40">
            <Plus size={15} /> Asignar
          </button>
        </div>
      </div>

      {/* Inventario del día */}
      <div className="material rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-white">Inventario y venta de frío</h3>
          {rows.length > 0 ? (
            <button onClick={saveInv} disabled={pending} className="press inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50">
              <Save size={15} /> Guardar
            </button>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500">Aún no hay frío asignado este día. Usa "Distribuir" arriba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-3 py-2 font-medium">Puesto</th>
                  <th className="px-3 py-2 font-medium">Pieza</th>
                  <th className="px-3 py-2 text-right font-medium">Recibido</th>
                  <th className="px-3 py-2 text-right font-medium">Precio frío</th>
                  <th className="px-3 py-2 text-right font-medium">Vendido</th>
                  <th className="px-3 py-2 text-right font-medium">Merma</th>
                  <th className="px-3 py-2 text-right font-medium">Ingreso</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const up = parseFloat(r.up) || 0, sold = parseFloat(r.sold) || 0;
                  const merma = r.quantityReceived - sold;
                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-200">{r.branchName}</td>
                      <td className="px-3 py-2 text-neutral-300">{r.pieceLabel}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{r.quantityReceived}</td>
                      <td className="px-3 py-2 text-right"><input type="number" min="0" step="0.5" value={r.up} onChange={(e) => setRow(r.id, "up", e.target.value)} className={`${field} w-24 text-right tabular-nums`} /></td>
                      <td className="px-3 py-2 text-right"><input type="number" min="0" step="0.5" value={r.sold} onChange={(e) => setRow(r.id, "sold", e.target.value)} className={`${field} w-24 text-right tabular-nums`} /></td>
                      <td className={`px-3 py-2 text-right tabular-nums ${merma > 0 ? "text-amber-300" : "text-neutral-400"}`}>{merma.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-300">{money(sold * up)}</td>
                      <td className="px-3 py-2 text-right"><button onClick={() => delRow(r.id)} className="text-neutral-500 hover:text-red-400"><Trash2 size={15} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 font-medium text-white">
                  <td className="px-3 py-3" colSpan={6}>Ingreso total de frío</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-300">{money(totalIngreso)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Precios fríos por puesto */}
      <div className="material rounded-3xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-medium text-white"><Tag size={16} className="text-orange-400" /> Precios de pollo frío por puesto</h3>
        <div className="mb-3 max-w-xs">
          <label className="mb-1 block text-xs text-neutral-400">Puesto</label>
          <select value={pBranch} onChange={(e) => selectPriceBranch(e.target.value)} className={`${field} w-full`}>
            <option value="">Selecciona…</option>
            {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {pBranch ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {data.pieces.map((pc) => (
                <div key={pc.pieceTypeId}>
                  <label className="mb-1 block text-xs text-neutral-400">{pc.label}</label>
                  <input type="number" min="0" step="0.5" value={prices[pc.pieceTypeId] ?? ""} onChange={(e) => setPrices((p) => ({ ...p, [pc.pieceTypeId]: e.target.value }))} className={`${field} w-full text-right tabular-nums`} />
                </div>
              ))}
            </div>
            <button onClick={savePrices} disabled={pending} className="press mt-4 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50">
              <Save size={15} /> Guardar precios
            </button>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Elige un puesto para ver/editar sus 8 precios de frío.</p>
        )}
      </div>
    </div>
  );
}
