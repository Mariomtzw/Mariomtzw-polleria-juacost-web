"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, PackageX } from "lucide-react";
import { createLeftover, deleteLeftover } from "@/lib/actions/leftovers";
import type { ColdDay } from "@/lib/queries/cold";
import { ConfirmDelete } from "@/components/admin/ui/ConfirmDelete";
import { Notice } from "@/components/admin/ui/Notice";

export function LeftoverCapture({ data }: { data: ColdDay }) {
  const router = useRouter();
  const id = useId();
  const [pending, start] = useTransition();
  const [branchId, setBranchId] = useState("");
  const [pieceTypeId, setPieceTypeId] = useState("");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const add = () => {
    setMsg(null);
    start(async () => {
      const res = await createLeftover({ date: data.date, branchId, pieceTypeId, quantity: qty });
      if (res.ok) {
        setQty("");
        router.refresh();
      } else {
        setMsg(res.error);
      }
    });
  };
  const del = (leftoverId: string) =>
    start(async () => {
      const r = await deleteLeftover(leftoverId);
      if (r.ok) router.refresh();
      else setMsg(r.error);
    });

  return (
    <section aria-labelledby={`${id}-title`} className="material rounded-3xl p-5">
      <h2 id={`${id}-title`} className="mb-1 flex items-center gap-2 font-medium text-white">
        <PackageX aria-hidden size={16} className="text-amber-400" /> Registrar sobras del día
      </h2>
      <p className="mb-3 text-xs text-neutral-400">Lo que sobró este día (al día siguiente se distribuye como frío).</p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div className="min-w-36 flex-1 sm:flex-none">
          <label htmlFor={`${id}-branch`} className="field-label">Puesto</label>
          <select id={`${id}-branch`} value={branchId} onChange={(e) => setBranchId(e.target.value)} className="field">
            <option value="">Selecciona…</option>
            {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="min-w-32 flex-1 sm:flex-none">
          <label htmlFor={`${id}-piece`} className="field-label">Pieza</label>
          <select id={`${id}-piece`} value={pieceTypeId} onChange={(e) => setPieceTypeId(e.target.value)} className="field">
            <option value="">Selecciona…</option>
            {data.pieces.map((p) => <option key={p.pieceTypeId} value={p.pieceTypeId}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-qty`} className="field-label">Cantidad</label>
          <input id={`${id}-qty`} type="number" inputMode="decimal" min="0" step="0.5" value={qty} onChange={(e) => setQty(e.target.value)} className="field field-num w-24" />
        </div>
        <button type="submit" disabled={pending || !branchId || !pieceTypeId || !qty} className="btn btn-primary">
          <Plus aria-hidden size={16} /> Agregar
        </button>
      </form>
      {msg ? <Notice ok={false} className="mt-3">{msg}</Notice> : null}

      {data.todayLeftovers.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Sobras registradas este día">
          {data.todayLeftovers.map((l) => (
            <li key={l.id} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-0.5 pl-3 pr-1 text-sm text-neutral-200">
              {l.branchName} · {l.pieceLabel}: <span className="tabular-nums text-amber-300">{l.quantity}</span>
              <ConfirmDelete label={`Eliminar sobra de ${l.pieceLabel} en ${l.branchName}`} onConfirm={() => del(l.id)} disabled={pending} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
