import type { Metadata } from "next";
import Link from "next/link";
import { getCorte } from "@/lib/queries/corte";
import { resolveDateParam } from "@/lib/dates";
import { DateNav } from "@/components/admin/ui/DateNav";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { TierBadge } from "@/components/admin/ui/TierBadge";
import { currency } from "@/components/admin/charts/chart-theme";

export const metadata: Metadata = { title: "Corte del día" };

function Stat({ label, value, tone = "text-white", hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div className="material rounded-3xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}

export default async function CortePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = resolveDateParam(sp.date);
  const { rows, totals } = await getCorte(date);
  const faltante = totals.diferencia > 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Corte del día" description="Cuánto debe entregar cada vendedora, según lo vendido y su sobrante." />

      <DateNav date={date} base="/admin/corte" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="A entregar (total)" value={currency(totals.aEntregar)} tone="text-orange-300" />
        <Stat label="Valor del sobrante" value={currency(totals.sobranteValor)} tone="text-sky-300" />
        <Stat label="Valor estimado" value={currency(totals.valorEstimado)} />
        <Stat
          label="Diferencia (control)"
          value={currency(totals.diferencia)}
          tone={faltante ? "text-red-300" : "text-emerald-300"}
          hint={rows.length === 0 ? undefined : faltante ? "Hay merma o faltante" : "Cuadra"}
        />
      </div>

      {rows.length === 0 ? (
        <div className="material rounded-3xl p-8 text-center text-sm text-neutral-400">
          No hay ventas capturadas este día.{" "}
          <Link href={`/admin/captura?date=${date}`} className="text-orange-300 underline underline-offset-4">
            Capturar este día
          </Link>
        </div>
      ) : (
        <div className="material overflow-x-auto rounded-3xl">
          <table className="table min-w-[820px]">
            <caption className="sr-only">Corte por vendedora</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky-col">Vendedora</th>
                <th scope="col">Puesto</th>
                <th scope="col" className="num text-orange-300">Debe entregar</th>
                <th scope="col" className="num">Sobrante ($)</th>
                <th scope="col" className="num">Valor estimado</th>
                <th scope="col" className="num">Diferencia</th>
                <th scope="col" className="text-center">Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <th scope="row" className="sticky-col text-left font-medium text-neutral-100">{r.sellerName}</th>
                  <td className="text-neutral-300">{r.branchName}</td>
                  <td className="num font-semibold text-orange-300">{currency(r.aEntregar)}</td>
                  <td className="num text-sky-300">{currency(r.sobranteValor)}</td>
                  <td className="num text-neutral-300">{currency(r.valorEstimado)}</td>
                  <td className={`num ${r.diferenciaControl > 1 ? "text-red-300" : "text-neutral-300"}`}>{currency(r.diferenciaControl)}</td>
                  <td className="text-center"><TierBadge tier={r.tier} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="grid max-w-[80ch] gap-x-6 gap-y-1 text-xs text-neutral-400 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-neutral-300">Debe entregar</dt>
        <dd>Dinero vendido en el día.</dd>
        <dt className="font-semibold text-neutral-300">Sobrante</dt>
        <dd>Producto no vendido (pasa a Pollo Frío), valuado a precio de pieza.</dd>
        <dt className="font-semibold text-neutral-300">Diferencia</dt>
        <dd>Valor estimado − Vendido − Sobrante. Si es positiva, hubo merma o faltante.</dd>
      </dl>
    </div>
  );
}
