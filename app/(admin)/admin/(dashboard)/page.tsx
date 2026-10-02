import {
  getSalesTrend, getBranchRanking, getSellerRanking, getDashboardTotals,
} from "@/lib/queries/analytics";
import { getKpiDeltas, getHeatmap } from "@/lib/queries/dashboard";
import { Panel } from "@/components/admin/ui/Panel";
import { KpiRow } from "@/components/admin/dashboard/KpiRow";
import { AreaTrendChart } from "@/components/admin/dashboard/AreaTrendChart";
import { Heatmap } from "@/components/admin/dashboard/Heatmap";
import { BranchRankingChart } from "@/components/admin/charts/BranchRankingChart";
import { SellerRankingChart } from "@/components/admin/charts/SellerRankingChart";
import { ExportButton } from "@/components/admin/ExportButton";

function Head({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold text-white">{title}</h2>
      {subtitle ? <p className="text-xs text-neutral-400">{subtitle}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const [trend, branchRank, sellerRank, totals, deltas, heatmap] = await Promise.all([
    getSalesTrend(30),
    getBranchRanking(30),
    getSellerRanking(30),
    getDashboardTotals(30),
    getKpiDeltas(30),
    getHeatmap(14),
  ]);
  const bestBranch = branchRank[0]?.name ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-neutral-400">Resumen de los últimos 30 días · variación vs. periodo anterior</p>
      </div>

      <KpiRow totals={totals} deltas={deltas} trend={trend} bestBranch={bestBranch} />

      <Panel className="p-5">
        <Head title="Tendencia de ventas" subtitle="Vendido Real (área) vs Valor Estimado (línea)" />
        <AreaTrendChart data={trend} />
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel className="p-5">
          <Head title="Ranking de sucursales" subtitle="Dónde se vende más" />
          <BranchRankingChart data={branchRank} />
        </Panel>
        <Panel className="p-5">
          <Head title="Ranking de vendedoras" subtitle="Semáforo de rendimiento" />
          <SellerRankingChart data={sellerRank} />
        </Panel>
      </div>

      <Panel className="p-5">
        <Head title="Mapa de calor · puesto × día" subtitle="Vendido Real por puesto en los últimos 14 días" />
        <Heatmap data={heatmap} />
      </Panel>

      <ExportButton />
    </div>
  );
}
