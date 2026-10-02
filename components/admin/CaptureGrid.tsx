"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, AlertCircle } from "lucide-react";
import { saveDayCapture } from "@/lib/actions/captureBulk";
import type { DayCapture, CaptureRow } from "@/lib/queries/capture";

type Tier = "GREEN" | "YELLOW" | "RED";

interface EditRow {
  branchId: string;
  branchName: string;
  precioPorPieza: number;
  sellerId: string;
  pollos: string;
  valorEstimado: string;
  vendidoReal: string;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TIER_STYLE: Record<Tier, string> = {
  GREEN: "bg-emerald-500/15 text-emerald-300",
  YELLOW: "bg-amber-500/15 text-amber-300",
  RED: "bg-red-500/15 text-red-300",
};
const TIER_LABEL: Record<Tier, string> = { GREEN: "Buena", YELLOW: "Regular", RED: "Baja" };

export function CaptureGrid({ data }: { data: DayCapture }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [rows, setRows] = useState<EditRow[]>(() =>
    data.rows.map((r: CaptureRow) => ({
      branchId: r.branchId,
      branchName: r.branchName,
      precioPorPieza: r.precioPorPieza,
      sellerId: r.sellerId ?? "",
      pollos: r.pollosAsignados != null ? String(r.pollosAsignados) : "",
      valorEstimado: r.valorEstimado != null ? String(r.valorEstimado) : "",
      vendidoReal: r.vendidoReal != null ? String(r.vendidoReal) : "",
    })),
  );

  const set = (i: number, field: keyof EditRow, value: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const goto = (dateStr: string) => router.push(`/admin/captura?date=${dateStr}`);

  const calc = (r: EditRow) => {
    const pollos = parseFloat(r.pollos) || 0;
    const vendido = parseFloat(r.vendidoReal) || 0;
    const eq = r.precioPorPieza > 0 ? vendido / r.precioPorPieza : 0;
    const dif = pollos - eq;
    const tier: Tier = dif < data.thresholds.greenMax ? "GREEN" : dif < data.thresholds.yellowMax ? "YELLOW" : "RED";
    return { eq, dif, tier, hasData: pollos > 0 };
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.pollos += parseFloat(r.pollos) || 0;
        acc.est += parseFloat(r.valorEstimado) || 0;
        acc.real += parseFloat(r.vendidoReal) || 0;
        return acc;
      },
      { pollos: 0, est: 0, real: 0 },
    );
  }, [rows]);

  const onSave = () => {
    setMsg(null);
    const payloadRows = rows
      .filter((r) => (parseFloat(r.pollos) || 0) > 0 && r.sellerId)
      .map((r) => ({
        branchId: r.branchId,
        sellerId: r.sellerId,
        pollosAsignados: parseFloat(r.pollos) || 0,
        valorEstimado: parseFloat(r.valorEstimado) || 0,
        vendidoReal: parseFloat(r.vendidoReal) || 0,
      }));
    if (payloadRows.length === 0) {
      setMsg({ ok: false, text: "Captura al menos un puesto (pollos + vendedora)." });
      return;
    }
    startTransition(async () => {
      const res = await saveDayCapture({ date: data.date, rows: payloadRows });
      if (res.ok) {
        setMsg({ ok: true, text: `Día guardado: ${res.saved} puesto(s).` });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  };

  const input =
    "w-full rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none focus:border-orange-500 tabular-nums text-right";
  const inputSel =
    "w-full rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none focus:border-orange-500";

  return (
    <div className="space-y-4">
      {/* Barra de fecha */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => goto(shiftDate(data.date, -1))} className="rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-300 hover:bg-white/10" aria-label="Día anterior">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <CalendarDays size={16} className="text-orange-400" />
          <input type="date" value={data.date} onChange={(e) => goto(e.target.value)} className="bg-transparent text-sm text-white outline-none" />
        </div>
        <button onClick={() => goto(shiftDate(data.date, 1))} className="rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-300 hover:bg-white/10" aria-label="Día siguiente">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => goto(new Date().toISOString().slice(0, 10))} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5">
          Hoy
        </button>
        <div className="ml-auto flex items-center gap-3">
          {msg ? (
            <span className={`flex items-center gap-1.5 text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
              {msg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
            </span>
          ) : null}
          <button onClick={onSave} disabled={pending} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50">
            <Save size={16} /> {pending ? "Guardando…" : "Guardar día"}
          </button>
        </div>
      </div>

      {/* Rejilla */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-3 py-3 font-medium">Puesto</th>
              <th className="px-3 py-3 font-medium">Vendedora</th>
              <th className="px-3 py-3 text-right font-medium">Pollos</th>
              <th className="px-3 py-3 text-right font-medium">Valor estimado</th>
              <th className="px-3 py-3 text-right font-medium">Vendido real</th>
              <th className="px-3 py-3 text-right font-medium">$/pieza</th>
              <th className="px-3 py-3 text-right font-medium">Equiv.</th>
              <th className="px-3 py-3 text-right font-medium">Dif.</th>
              <th className="px-3 py-3 text-center font-medium">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const c = calc(r);
              return (
                <tr key={r.branchId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-200">{r.branchName}</td>
                  <td className="px-3 py-2 min-w-[140px]">
                    <select value={r.sellerId} onChange={(e) => set(i, "sellerId", e.target.value)} className={inputSel}>
                      <option value="">—</option>
                      {data.sellers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 w-24"><input type="number" step="0.01" min="0" value={r.pollos} onChange={(e) => set(i, "pollos", e.target.value)} className={input} /></td>
                  <td className="px-3 py-2 w-28"><input type="number" step="0.01" min="0" value={r.valorEstimado} onChange={(e) => set(i, "valorEstimado", e.target.value)} className={input} /></td>
                  <td className="px-3 py-2 w-28"><input type="number" step="0.01" min="0" value={r.vendidoReal} onChange={(e) => set(i, "vendidoReal", e.target.value)} className={input} /></td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-400">{r.precioPorPieza ? money(r.precioPorPieza) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{c.hasData ? c.eq.toFixed(1) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{c.hasData ? c.dif.toFixed(1) : "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {c.hasData ? (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${TIER_STYLE[c.tier]}`}>{TIER_LABEL[c.tier]}</span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-white/[0.03] font-medium text-white">
              <td className="px-3 py-3" colSpan={2}>Total del día</td>
              <td className="px-3 py-3 text-right tabular-nums">{totals.pollos.toFixed(0)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{money(totals.est)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-orange-300">{money(totals.real)}</td>
              <td colSpan={3}></td>
              <td className="px-3 py-3 text-center text-xs text-neutral-400">{rows.filter((r) => (parseFloat(r.pollos) || 0) > 0).length}/9</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        Los 8 precios de despiece se toman automáticamente de la lista vigente de cada puesto y se guardan como snapshot. Puedes capturar cualquier fecha (incluidas anteriores).
      </p>
    </div>
  );
}
