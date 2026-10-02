import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Crown } from "lucide-react";
import { Panel } from "@/components/admin/ui/Panel";
import { Sparkline } from "@/components/admin/ui/Sparkline";
import { currency } from "@/components/admin/charts/chart-theme";
import type { DashboardTotals, TrendPoint } from "@/lib/queries/analytics";
import type { KpiDeltas } from "@/lib/queries/dashboard";

function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-neutral-500">sin base</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(pct).toFixed(0)}%
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
      <Panel className="p-4" delay={0}>
        <div className="flex items-start justify-between">
          <Label>Vendido real</Label>
          <Delta pct={deltas.vendido.deltaPct} />
        </div>
        <Value>{currency(totals.vendidoReal)}</Value>
        <div className="mt-2"><Sparkline data={vSpark} color="#d95926" /></div>
      </Panel>

      <Panel className="p-4" delay={0.04}>
        <div className="flex items-start justify-between">
          <Label>Valor estimado</Label>
          <Delta pct={deltas.estimado.deltaPct} />
        </div>
        <Value>{currency(totals.valorEstimado)}</Value>
        <div className="mt-2"><Sparkline data={eSpark} color="#0d9488" /></div>
      </Panel>

      <Panel className="p-4" delay={0.08}>
        <Label>Cumplimiento</Label>
        <Value>{cumpl.toFixed(0)}%</Value>
        <p className="mt-2 text-xs text-neutral-500">real ÷ estimado</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, cumpl)}%` }} />
        </div>
      </Panel>

      <Panel className="p-4" delay={0.12}>
        <div className="flex items-start justify-between">
          <Label>Pollos asignados</Label>
          <Delta pct={deltas.pollos.deltaPct} />
        </div>
        <Value>{totals.pollosAsignados.toLocaleString("es-MX")}</Value>
        <p className="mt-2 text-xs text-neutral-500">{totals.dias} día(s) con registro</p>
      </Panel>

      <Panel className="col-span-2 p-4 lg:col-span-4 xl:col-span-1" delay={0.16}>
        <div className="flex items-center gap-1.5 text-orange-400"><Crown size={14} /><Label>Mejor puesto</Label></div>
        <p className="mt-2 text-lg font-semibold text-white">{bestBranch || "—"}</p>
        <p className="mt-1 text-xs text-neutral-500">por vendido real</p>
      </Panel>
    </div>
  );
}
