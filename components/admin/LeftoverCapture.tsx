"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, PackageX } from "lucide-react";
import { createLeftover, deleteLeftover } from "@/lib/actions/leftovers";
import type { ColdDay } from "@/lib/queries/cold";

const field = "rounded-lg border border-white/10 bg-neutral-900 px-2.5 py-1.5 text-sm text-white outline-none focus:border-orange-500";

export function LeftoverCapture({ data }: { data: ColdDay }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [branchId, setBranchId] = useState("");
  const [pieceTypeId, setPieceTypeId] = useState("");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const add = () => {
    setMsg(null);
    start(async () => {
      const res = await createLeftover({ date: data.date, branchId, pieceTypeId, quantity: qty });
      if (res.ok) { setQty(""); router.refresh(); } else setMsg(res.error);
    });
  };
  const del = (id: string) => start(async () => { const r = await deleteLeftover(id); if (r.ok) router.refresh(); });

  return (
    <div className="material rounded-3xl p-5">
      <h3 className="mb-1 flex items-center gap-2 font-medium text-white"><PackageX size={16} className="text-amber-400" /> Registrar sobras del día</h3>
      <p className="mb-3 text-xs text-neutral-400">Lo que sobró hoy (mañana se distribuye como frío).</p>
      <div className="flex flex-wrap items-end gap-3">
        <div><label className="mb-1 block text-xs text-neutral-400">Puesto</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={field}>
            <option value="">Selecciona…</option>
            {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div><label className="mb-1 block text-xs text-neutral-400">Pieza</label>
          <select value={pieceTypeId} onChange={(e) => setPieceTypeId(e.target.value)} className={field}>
            <option value="">Selecciona…</option>
            {data.pieces.map((p) => <option key={p.pieceTypeId} value={p.pieceTypeId}>{p.label}</option>)}
          </select>
        </div>
        <div><label className="mb-1 block text-xs text-neutral-400">Cantidad</label>
          <input type="number" min="0" step="0.5" value={qty} onChange={(e) => setQty(e.target.value)} className={`${field} w-24 text-right tabular-nums`} />
        </div>
        <button onClick={add} disabled={pending || !branchId || !pieceTypeId || !qty} className="press inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-40">
          <Plus size={15} /> Agregar
        </button>
        {msg ? <span className="text-sm text-red-400">{msg}</span> : null}
      </div>

      {data.todayLeftovers.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.todayLeftovers.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-200">
              {l.branchName} · {l.pieceLabel}: <span className="tabular-nums text-amber-300">{l.quantity}</span>
              <button onClick={() => del(l.id)} className="text-neutral-500 hover:text-red-400"><Trash2 size={13} /></button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
