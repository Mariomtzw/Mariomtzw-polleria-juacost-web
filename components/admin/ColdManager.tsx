"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Snowflake, Plus, Save, Tag } from "lucide-react";
import { distributeCold, saveColdInventory, deleteColdStock, setColdPrices } from "@/lib/actions/cold";
import type { ColdDay } from "@/lib/queries/cold";
import { currency } from "@/components/admin/charts/chart-theme";
import { ConfirmDelete } from "@/components/admin/ui/ConfirmDelete";
import { Notice } from "@/components/admin/ui/Notice";

const num = (s: string | undefined) => parseFloat(s ?? "") || 0;

export function ColdManager({ data }: { data: ColdDay }) {
  const router = useRouter();
  const id = useId();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; text: string }>) => {
    setMsg(null);
    start(async () => setMsg(await fn()));
  };

  // --- Distribuir ---
  const [dBranch, setDBranch] = useState("");
  const [dPiece, setDPiece] = useState("");
  const [dQty, setDQty] = useState("");
  const addDistribution = () =>
    run(async () => {
      const res = await distributeCold({ date: data.date, rows: [{ branchId: dBranch, pieceTypeId: dPiece, quantity: dQty }] });
      if (res.ok) {
        setDQty("");
        router.refresh();
        return { ok: true, text: "Frío asignado al puesto." };
      }
      return { ok: false, text: res.error };
    });

  // --- Inventario editable ---
  // Las filas salen siempre de los datos del servidor (así aparecen en cuanto
  // se asigna frío); encima van solo los cambios que aún no se guardan.
  const [edits, setEdits] = useState<Record<string, { up?: string; sold?: string }>>({});
  const rows = useMemo(
    () =>
      data.stock.map((s) => ({
        ...s,
        up: edits[s.id]?.up ?? String(s.unitPrice),
        sold: edits[s.id]?.sold ?? String(s.quantitySold),
      })),
    [data.stock, edits],
  );
  const setRow = (rowId: string, k: "up" | "sold", v: string) =>
    setEdits((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [k]: v } }));
  const invDirty = rows.some((r) => num(r.up) !== r.unitPrice || num(r.sold) !== r.quantitySold);
  const saveInv = () =>
    run(async () => {
      const res = await saveColdInventory({
        rows: rows.map((r) => ({ id: r.id, unitPrice: num(r.up), quantitySold: num(r.sold) })),
      });
      if (res.ok) {
        setEdits({});
        router.refresh();
        return { ok: true, text: "Inventario guardado." };
      }
      return { ok: false, text: res.error };
    });
  const delRow = (rowId: string) =>
    run(async () => {
      const res = await deleteColdStock(rowId);
      if (res.ok) {
        router.refresh();
        return { ok: true, text: "Renglón eliminado." };
      }
      return { ok: false, text: res.error };
    });

  const totalIngreso = useMemo(() => rows.reduce((a, r) => a + num(r.sold) * num(r.up), 0), [rows]);

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
    for (const pc of data.pieces) {
      const v = priceMap.get(`${branchId}:${pc.pieceTypeId}`);
      init[pc.pieceTypeId] = v != null ? String(v) : "";
    }
    setPrices(init);
  };
  const savePrices = () =>
    run(async () => {
      const list = data.pieces
        .filter((pc) => prices[pc.pieceTypeId] !== undefined && prices[pc.pieceTypeId] !== "")
        .map((pc) => ({ pieceTypeId: pc.pieceTypeId, price: num(prices[pc.pieceTypeId]) }));
      if (!pBranch || list.length === 0) return { ok: false, text: "Elige puesto y captura al menos un precio." };
      const res = await setColdPrices({ branchId: pBranch, prices: list });
      if (res.ok) {
        router.refresh();
        return { ok: true, text: "Precios fríos guardados." };
      }
      return { ok: false, text: res.error };
    });

  return (
    <div className="space-y-6">
      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}

      {/* Sobrante disponible (día anterior) */}
      <section aria-labelledby={`${id}-pool`} className="material rounded-3xl p-5">
        <h2 id={`${id}-pool`} className="mb-1 flex items-center gap-2 font-medium text-white">
          <Snowflake aria-hidden size={16} className="text-sky-400" /> Sobrante disponible (día anterior)
        </h2>
        <p className="mb-3 text-xs text-neutral-400">Piezas frescas que sobraron el día anterior y este día se venden como frío.</p>
        {data.pool.length === 0 ? (
          <p className="text-sm text-neutral-400">No hay sobrante registrado el día anterior.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.pool.map((p) => (
              <li key={p.pieceTypeId} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-200">
                {p.label}: <span className="tabular-nums text-sky-300">{p.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Distribuir */}
      <section aria-labelledby={`${id}-dist`} className="material rounded-3xl p-5">
        <h2 id={`${id}-dist`} className="mb-3 font-medium text-white">Distribuir frío a un puesto</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            addDistribution();
          }}
        >
          <div className="min-w-36 flex-1 sm:flex-none">
            <label htmlFor={`${id}-d-branch`} className="field-label">Puesto</label>
            <select id={`${id}-d-branch`} value={dBranch} onChange={(e) => setDBranch(e.target.value)} className="field">
              <option value="">Selecciona…</option>
              {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="min-w-32 flex-1 sm:flex-none">
            <label htmlFor={`${id}-d-piece`} className="field-label">Pieza</label>
            <select id={`${id}-d-piece`} value={dPiece} onChange={(e) => setDPiece(e.target.value)} className="field">
              <option value="">Selecciona…</option>
              {data.pieces.map((p) => <option key={p.pieceTypeId} value={p.pieceTypeId}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-d-qty`} className="field-label">Cantidad</label>
            <input id={`${id}-d-qty`} type="number" inputMode="decimal" min="0" step="0.5" value={dQty} onChange={(e) => setDQty(e.target.value)} className="field field-num w-24" />
          </div>
          <button type="submit" disabled={pending || !dBranch || !dPiece || !dQty} className="btn btn-primary">
            <Plus aria-hidden size={16} /> Asignar
          </button>
        </form>
      </section>

      {/* Inventario del día */}
      <section aria-labelledby={`${id}-inv`} className="material rounded-3xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${id}-inv`} className="font-medium text-white">Inventario y venta de frío</h2>
          {rows.length > 0 ? (
            <div className="flex items-center gap-3">
              {invDirty ? <span className="text-sm text-amber-300">Cambios sin guardar</span> : null}
              <button type="button" onClick={saveInv} disabled={pending || !invDirty} className="btn btn-primary">
                <Save aria-hidden size={16} /> Guardar
              </button>
            </div>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-400">Aún no hay frío asignado este día. Usa «Distribuir frío a un puesto».</p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="table min-w-[720px]">
              <caption className="sr-only">Inventario de pollo frío del día</caption>
              <thead>
                <tr>
                  <th scope="col">Puesto</th>
                  <th scope="col">Pieza</th>
                  <th scope="col" className="num">Recibido</th>
                  <th scope="col" className="num">Precio frío</th>
                  <th scope="col" className="num">Vendido</th>
                  <th scope="col" className="num">Merma</th>
                  <th scope="col" className="num">Ingreso</th>
                  <th scope="col"><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const up = num(r.up);
                  const sold = num(r.sold);
                  const merma = r.quantityReceived - sold;
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap text-neutral-100">{r.branchName}</td>
                      <td className="text-neutral-300">{r.pieceLabel}</td>
                      <td className="num text-neutral-300">{r.quantityReceived}</td>
                      <td className="text-right">
                        <input type="number" inputMode="decimal" min="0" step="0.5" value={r.up} onChange={(e) => setRow(r.id, "up", e.target.value)} aria-label={`Precio frío de ${r.pieceLabel} en ${r.branchName}`} className="field field-num ml-auto w-24" />
                      </td>
                      <td className="text-right">
                        <input type="number" inputMode="decimal" min="0" step="0.5" value={r.sold} onChange={(e) => setRow(r.id, "sold", e.target.value)} aria-label={`Vendido de ${r.pieceLabel} en ${r.branchName}`} aria-invalid={merma < 0 ? true : undefined} className="field field-num ml-auto w-24" />
                      </td>
                      <td className={`num ${merma < 0 ? "text-red-300" : merma > 0 ? "text-amber-300" : "text-neutral-400"}`}>
                        {merma.toFixed(1)}
                        {merma < 0 ? <span className="block text-xs">más de lo recibido</span> : null}
                      </td>
                      <td className="num text-emerald-300">{currency(sold * up)}</td>
                      <td className="text-right">
                        <ConfirmDelete label={`Eliminar ${r.pieceLabel} de ${r.branchName}`} onConfirm={() => delRow(r.id)} disabled={pending} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>Ingreso total de frío</td>
                  <td className="num text-emerald-300">{currency(totalIngreso)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Precios fríos por puesto */}
      <section aria-labelledby={`${id}-prices`} className="material rounded-3xl p-5">
        <h2 id={`${id}-prices`} className="mb-3 flex items-center gap-2 font-medium text-white">
          <Tag aria-hidden size={16} className="text-orange-400" /> Precios de pollo frío por puesto
        </h2>
        <div className="mb-3 max-w-xs">
          <label htmlFor={`${id}-p-branch`} className="field-label">Puesto</label>
          <select id={`${id}-p-branch`} value={pBranch} onChange={(e) => selectPriceBranch(e.target.value)} className="field">
            <option value="">Selecciona…</option>
            {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {pBranch ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              savePrices();
            }}
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {data.pieces.map((pc) => (
                <div key={pc.pieceTypeId}>
                  <label htmlFor={`${id}-p-${pc.pieceTypeId}`} className="field-label">{pc.label}</label>
                  <input id={`${id}-p-${pc.pieceTypeId}`} type="number" inputMode="decimal" min="0" step="0.5" value={prices[pc.pieceTypeId] ?? ""} onChange={(e) => setPrices((p) => ({ ...p, [pc.pieceTypeId]: e.target.value }))} className="field field-num" />
                </div>
              ))}
            </div>
            <button type="submit" disabled={pending} className="btn btn-primary mt-4">
              <Save aria-hidden size={16} /> Guardar precios
            </button>
          </form>
        ) : (
          <p className="text-sm text-neutral-400">Elige un puesto para ver y editar sus 8 precios de frío.</p>
        )}
      </section>
    </div>
  );
}
