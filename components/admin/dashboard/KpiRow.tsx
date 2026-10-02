import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Crown } from "lucide-react";
import { Panel } from "@/components/admin/ui/Panel";
import { Sparkline } from "@/components/admin/ui/Sparkline";
import { currency } from "@/components/admin/charts/chart-theme";
import type { DashboardTotals, TrendPoint } from "@/lib/queries/analytics";
import type { KpiDeltas } from "@/lib/queries/dashboard";

function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-neutral-400">sin base</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <ArrowUpRight aria-hidden size={13} /> : <ArrowDownRight aria-hidden size={13} />}
      <span className="sr-only">{up ? "Subió" : "Bajó"}</span>
      {Math.abs(pct).toFixed(0)}%<span className="sr-only"> frente al periodo anterior</span>
    </span>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{children}</p>
);
const Value = ({ children }: { children: ReactNode }) => (
  <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{children}</p>
);

export function KpiRow({
  totals,
  deltas,
  trend,
  bestBranch,
}: {
  totals: DashboardTotals;
  deltas: KpiDeltas;
  trend: TrendPoint[];
  bestBranch: string;
}) {
  const cumpl = totals.valorEstimado > 0 ? (totals.vendidoReal / totals.valorEstimado) * 100 : 0;
  const vSpark = trend.map((t) => t.vendidoReal);
  const eSpark = trend.map((t) => t.valorEstimado);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
      <Panel className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Label>Vendido real</Label>
          <Delta pct={deltas.vendido.deltaPct} />
        </div>
        <Value>{currency(totals.vendidoReal)}</Value>
        <div className="mt-2"><Sparkline data={vSpark} color="#d95926" /></div>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Label>Valor estimado</Label>
          <Delta pct={deltas.estimado.deltaPct} />
        </div>
        <Value>{currency(totals.valorEstimado)}</Value>
        <div className="mt-2"><Sparkline data={eSpark} color="#0d9488" /></div>
      </Panel>

      <Panel className="p-4">
        <Label>Cumplimiento</Label>
        <Value>{cumpl.toFixed(0)}%</Value>
        <p className="mt-2 text-xs text-neutral-400">real ÷ estimado</p>
        <div aria-hidden className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, cumpl)}%` }} />
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Label>Pollos asignados</Label>
          <Delta pct={deltas.pollos.deltaPct} />
        </div>
        <Value>{totals.pollosAsignados.toLocaleString("es-MX")}</Value>
        <p className="mt-2 text-xs text-neutral-400">{totals.dias} día(s) con registro</p>
      </Panel>

      <Panel className="col-span-2 p-4 lg:col-span-4 xl:col-span-1">
        <div className="flex items-center gap-1.5 text-orange-400"><Crown aria-hidden size={14} /><Label>Mejor puesto</Label></div>
        <p className="mt-2 text-lg font-semibold text-white">{bestBranch || "—"}</p>
        <p className="mt-1 text-xs text-neutral-400">por vendido real</p>
      </Panel>
    </div>
  );
}
