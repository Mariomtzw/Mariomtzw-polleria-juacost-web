"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveDayCapture } from "@/lib/actions/captureBulk";
import type { DayCapture, CaptureRow } from "@/lib/queries/capture";
import { currency } from "@/components/admin/charts/chart-theme";
import { DateNav } from "@/components/admin/ui/DateNav";
import { Notice } from "@/components/admin/ui/Notice";
import { TierBadge, type Tier } from "@/components/admin/ui/TierBadge";

interface EditRow {
  branchId: string;
  branchName: string;
  precioPorPieza: number;
  sellerId: string;
  pollos: string;
  valorEstimado: string;
  vendidoReal: string;
}

type NumberField = "pollos" | "valorEstimado" | "vendidoReal";

const NUMBER_FIELDS: Array<{ key: NumberField; label: string; short: string }> = [
  { key: "pollos", label: "Pollos", short: "Pollos" },
  { key: "valorEstimado", label: "Valor estimado", short: "Estimado" },
  { key: "vendidoReal", label: "Vendido real", short: "Vendido" },
];

const num = (s: string) => parseFloat(s) || 0;

const toEditRow = (r: CaptureRow): EditRow => ({
  branchId: r.branchId,
  branchName: r.branchName,
  precioPorPieza: r.precioPorPieza,
  sellerId: r.sellerId ?? "",
  pollos: r.pollosAsignados != null ? String(r.pollosAsignados) : "",
  valorEstimado: r.valorEstimado != null ? String(r.valorEstimado) : "",
  vendidoReal: r.vendidoReal != null ? String(r.vendidoReal) : "",
});

/** Qué le falta a una fila para poder guardarse (o `null` si está completa o vacía). */
function missingIn(r: EditRow): "seller" | "pollos" | null {
  const pollos = num(r.pollos);
  if (pollos > 0 && !r.sellerId) return "seller";
  if (pollos <= 0 && (num(r.valorEstimado) > 0 || num(r.vendidoReal) > 0)) return "pollos";
  return null;
}

/**
 * Captura de un día: los puestos como filas (tabla en pantallas anchas,
 * tarjetas en el teléfono) y un solo botón para guardar todo.
 *
 * La página monta este componente con `key={data.date}`: al cambiar de fecha
 * se crea de nuevo y nunca se mezclan los números de un día con otro.
 */
export function CaptureGrid({ data }: { data: DayCapture }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showMissing, setShowMissing] = useState(false);

  const saved = useMemo(() => data.rows.map(toEditRow), [data.rows]);
  const [rows, setRows] = useState<EditRow[]>(saved);

  const set = (i: number, field: keyof EditRow, value: string) => {
    setMsg(null);
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const calc = (r: EditRow) => {
    const pollos = num(r.pollos);
    const eq = r.precioPorPieza > 0 ? num(r.vendidoReal) / r.precioPorPieza : 0;
    const dif = pollos - eq;
    const tier: Tier = dif < data.thresholds.greenMax ? "GREEN" : dif < data.thresholds.yellowMax ? "YELLOW" : "RED";
    return { eq, dif, tier, hasData: pollos > 0 };
  };

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.pollos += num(r.pollos);
          acc.est += num(r.valorEstimado);
          acc.real += num(r.vendidoReal);
          if (num(r.pollos) > 0) acc.captured += 1;
          return acc;
        },
        { pollos: 0, est: 0, real: 0, captured: 0 },
      ),
    [rows],
  );

  // Hay cambios sin guardar si algo difiere de lo que ya está en la base.
  const dirty = rows.some((r, i) => {
    const s = saved[i];
    return (
      !s ||
      r.sellerId !== s.sellerId ||
      num(r.pollos) !== num(s.pollos) ||
      num(r.valorEstimado) !== num(s.valorEstimado) ||
      num(r.vendidoReal) !== num(s.vendidoReal)
    );
  });

  const onSave = () => {
    setMsg(null);
    const noSeller = rows.filter((r) => missingIn(r) === "seller").map((r) => r.branchName);
    const noPollos = rows.filter((r) => missingIn(r) === "pollos").map((r) => r.branchName);
    if (noSeller.length > 0 || noPollos.length > 0) {
      setShowMissing(true);
      const parts = [
        noSeller.length > 0 ? `Elige la vendedora de: ${noSeller.join(", ")}.` : "",
        noPollos.length > 0 ? `Escribe los pollos de: ${noPollos.join(", ")}.` : "",
      ].filter(Boolean);
      setMsg({ ok: false, text: `No se guardó. ${parts.join(" ")}` });
      return;
    }

    const payloadRows = rows
      .filter((r) => num(r.pollos) > 0)
      .map((r) => ({
        branchId: r.branchId,
        sellerId: r.sellerId,
        pollosAsignados: num(r.pollos),
        valorEstimado: num(r.valorEstimado),
        vendidoReal: num(r.vendidoReal),
      }));
    if (payloadRows.length === 0) {
      setMsg({ ok: false, text: "Captura al menos un puesto (pollos y vendedora)." });
      return;
    }

    startTransition(async () => {
      const res = await saveDayCapture({ date: data.date, rows: payloadRows });
      if (res.ok) {
        setShowMissing(false);
        setMsg({ ok: true, text: `Día guardado: ${res.saved} puesto(s).` });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  };

  const sellerInvalid = (r: EditRow) => (showMissing && missingIn(r) === "seller" ? true : undefined);
  const pollosInvalid = (r: EditRow) => (showMissing && missingIn(r) === "pollos" ? true : undefined);

  const sellerSelect = (r: EditRow, i: number) => (
    <select
      value={r.sellerId}
      onChange={(e) => set(i, "sellerId", e.target.value)}
      aria-label={`Vendedora de ${r.branchName}`}
      aria-invalid={sellerInvalid(r)}
      className="field"
    >
      <option value="">Elegir…</option>
      {data.sellers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );

  const numberInput = (r: EditRow, i: number, key: NumberField, label: string) => (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0"
      value={r[key]}
      onChange={(e) => set(i, key, e.target.value)}
      aria-label={`${label} de ${r.branchName}`}
      aria-invalid={key === "pollos" ? pollosInvalid(r) : undefined}
      className="field field-num"
    />
  );

  const saveButton = (
    <button type="button" onClick={onSave} disabled={pending} className="btn btn-primary">
      <Save aria-hidden size={16} /> {pending ? "Guardando…" : "Guardar día"}
    </button>
  );

  const status = msg ? (
    <Notice ok={msg.ok}>{msg.text}</Notice>
  ) : dirty ? (
    <p className="flex items-center gap-1.5 text-sm text-amber-300">
      <span aria-hidden className="size-2 rounded-full bg-amber-400" /> Cambios sin guardar
    </p>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <DateNav date={data.date} base="/admin/captura" />
        <div className="hidden items-center gap-3 md:flex">
          {status}
          {saveButton}
        </div>
      </div>

      {/* Pantallas anchas: rejilla tipo Excel */}
      <div className="material hidden overflow-x-auto rounded-3xl md:block">
        <table className="table min-w-[900px]">
          <caption className="sr-only">Captura de ventas por puesto</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky-col">Puesto</th>
              <th scope="col">Vendedora</th>
              <th scope="col" className="num">Pollos</th>
              <th scope="col" className="num">Valor estimado</th>
              <th scope="col" className="num">Vendido real</th>
              <th scope="col" className="num">$/pieza</th>
              <th scope="col" className="num">Equiv.</th>
              <th scope="col" className="num">Dif.</th>
              <th scope="col" className="text-center">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const c = calc(r);
              return (
                <tr key={r.branchId}>
                  <th scope="row" className="sticky-col whitespace-nowrap text-left font-medium text-neutral-100">
                    {r.branchName}
                  </th>
                  <td className="min-w-[150px]">{sellerSelect(r, i)}</td>
                  <td className="w-24">{numberInput(r, i, "pollos", "Pollos")}</td>
                  <td className="w-32">{numberInput(r, i, "valorEstimado", "Valor estimado")}</td>
                  <td className="w-32">{numberInput(r, i, "vendidoReal", "Vendido real")}</td>
                  <td className="num text-neutral-400">{r.precioPorPieza ? currency(r.precioPorPieza) : "—"}</td>
                  <td className="num text-neutral-300">{c.hasData ? c.eq.toFixed(1) : "—"}</td>
                  <td className="num text-neutral-300">{c.hasData ? c.dif.toFixed(1) : "—"}</td>
                  <td className="text-center">
                    {c.hasData ? <TierBadge tier={c.tier} /> : <span className="text-neutral-500">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="sticky-col">Total del día</td>
              <td className="num">{totals.pollos.toFixed(0)}</td>
              <td className="num">{currency(totals.est)}</td>
              <td className="num text-orange-300">{currency(totals.real)}</td>
              <td colSpan={3}></td>
              <td className="text-center text-xs font-normal text-neutral-400">
                {totals.captured} de {rows.length} puestos
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Teléfono: una tarjeta por puesto */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r, i) => {
          const c = calc(r);
          return (
            <li key={r.branchId} className="material rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-medium text-white">{r.branchName}</h3>
                {c.hasData ? <TierBadge tier={c.tier} /> : <span className="text-xs text-neutral-400">Sin capturar</span>}
              </div>
              <div className="space-y-3">
                <div>
                  <span aria-hidden className="field-label">Vendedora</span>
                  {sellerSelect(r, i)}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {NUMBER_FIELDS.map((f) => (
                    <div key={f.key}>
                      <span aria-hidden className="field-label">{f.short}</span>
                      {numberInput(r, i, f.key, f.label)}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs tabular-nums text-neutral-400">
                {r.precioPorPieza ? `${currency(r.precioPorPieza)} por pollo` : "Sin lista de precios"}
                {c.hasData ? ` · Equivale a ${c.eq.toFixed(1)} · Diferencia ${c.dif.toFixed(1)}` : ""}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Teléfono: totales y guardar siempre a la mano */}
      <div className="material material-solid sticky bottom-3 z-10 space-y-2 rounded-2xl p-3 md:hidden">
        {status}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm tabular-nums text-neutral-300">
            <span className="font-semibold text-orange-300">{currency(totals.real)}</span> vendido
            <span className="block text-xs text-neutral-400">
              {totals.captured} de {rows.length} puestos · {totals.pollos.toFixed(0)} pollos
            </span>
          </p>
          {saveButton}
        </div>
      </div>

      <p className="max-w-[72ch] text-xs text-neutral-400">
        Los 8 precios de despiece se toman automáticamente de la lista vigente de cada puesto y se guardan junto con la venta. Puedes capturar cualquier fecha (incluidas anteriores).
      </p>
    </div>
  );
}
