import { getCorte } from "@/lib/queries/corte";
import { DateNav } from "@/components/admin/ui/DateNav";
import { currency } from "@/components/admin/charts/chart-theme";

const TIER = {
  GREEN: { c: "bg-emerald-500/15 text-emerald-300", t: "Buena" },
  YELLOW: { c: "bg-amber-500/15 text-amber-300", t: "Regular" },
  RED: { c: "bg-red-500/15 text-red-300", t: "Baja" },
} as const;

export default async function CortePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : new Date().toISOString().slice(0, 10);
  const { rows, totals } = await getCorte(date);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Corte del día</h1>
        <p className="text-sm text-neutral-400">Cuánto debe entregar cada vendedora, según lo vendido y su sobrante.</p>
      </div>

      <DateNav date={date} base="/admin/corte" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="material rounded-3xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">A entregar (total)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-orange-300">{currency(totals.aEntregar)}</p>
        </div>
        <div className="material rounded-3xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Valor del sobrante</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-300">{currency(totals.sobranteValor)}</p>
        </div>
        <div className="material rounded-3xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Valor estimado</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{currency(totals.valorEstimado)}</p>
        </div>
        <div className="material rounded-3xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Diferencia (control)</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${totals.diferencia > 1 ? "text-red-300" : "text-emerald-300"}`}>{currency(totals.diferencia)}</p>
        </div>
      </div>

      <div className="material overflow-x-auto rounded-3xl">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">No hay ventas capturadas este día.</div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3 font-medium">Vendedora</th>
                <th className="px-4 py-3 font-medium">Puesto</th>
                <th className="px-4 py-3 text-right font-medium text-orange-300">Debe entregar</th>
                <th className="px-4 py-3 text-right font-medium">Sobrante ($)</th>
                <th className="px-4 py-3 text-right font-medium">Valor estimado</th>
                <th className="px-4 py-3 text-right font-medium">Diferencia</th>
                <th className="px-4 py-3 text-center font-medium">Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const tier = TIER[r.tier];
                return (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-neutral-100">{r.sellerName}</td>
                    <td className="px-4 py-3 text-neutral-300">{r.branchName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-orange-300">{currency(r.aEntregar)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sky-300">{currency(r.sobranteValor)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-300">{currency(r.valorEstimado)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${r.diferenciaControl > 1 ? "text-red-300" : "text-neutral-300"}`}>{currency(r.diferenciaControl)}</td>
                    <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-[11px] ${tier.c}`}>{tier.t}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        <b>Debe entregar</b> = dinero vendido en el día. <b>Sobrante</b> = producto no vendido (pasa a Pollo Frío), valuado a precio de pieza.
        <b> Diferencia</b> = Valor estimado − Vendido − Sobrante (si es positivo, hubo merma o faltante).
      </p>
    </div>
  );
}
