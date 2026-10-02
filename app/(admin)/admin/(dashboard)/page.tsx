import type { Metadata } from "next";
import {
  getSalesTrend, getBranchRanking, getSellerRanking, getDashboardTotals,
} from "@/lib/queries/analytics";
import { getKpiDeltas, getHeatmap, getTodayStatus } from "@/lib/queries/dashboard";
import { Panel } from "@/components/admin/ui/Panel";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { KpiRow } from "@/components/admin/dashboard/KpiRow";
import { TodayCard } from "@/components/admin/dashboard/TodayCard";
import { AreaTrendChart } from "@/components/admin/dashboard/AreaTrendChart";
import { Heatmap } from "@/components/admin/dashboard/Heatmap";
import { BranchRankingChart } from "@/components/admin/charts/BranchRankingChart";
import { SellerRankingChart } from "@/components/admin/charts/SellerRankingChart";
import { ExportButton } from "@/components/admin/ExportButton";

export const metadata: Metadata = { title: "Dashboard" };

function Head({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 id={id} className="font-semibold text-white">{title}</h2>
      {subtitle ? <p className="text-xs text-neutral-400">{subtitle}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const [trend, branchRank, sellerRank, totals, deltas, heatmap, today] = await Promise.all([
    getSalesTrend(30),
    getBranchRanking(30),
    getSellerRanking(30),
    getDashboardTotals(30),
    getKpiDeltas(30),
    getHeatmap(14),
    getTodayStatus(),
  ]);
  const bestBranch = branchRank[0]?.name ?? "";

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Resumen de los últimos 30 días · variación vs. periodo anterior" />

      <TodayCard status={today} />

      <KpiRow totals={totals} deltas={deltas} trend={trend} bestBranch={bestBranch} />

      <Panel className="p-5" labelledBy="tendencia-title">
        <Head id="tendencia-title" title="Tendencia de ventas" subtitle="Vendido Real (área) vs Valor Estimado (línea)" />
        <AreaTrendChart data={trend} />
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel className="p-5" labelledBy="puestos-title">
          <Head id="puestos-title" title="Ranking de sucursales" subtitle="Dónde se vende más" />
          <BranchRankingChart data={branchRank} />
        </Panel>
        <Panel className="p-5" labelledBy="vendedoras-title">
          <Head id="vendedoras-title" title="Ranking de vendedoras" subtitle="Semáforo de rendimiento" />
          <SellerRankingChart data={sellerRank} />
        </Panel>
      </div>

      <Panel className="p-5" labelledBy="calor-title">
        <Head id="calor-title" title="Mapa de calor · puesto × día" subtitle="Vendido Real por puesto en los últimos 14 días" />
        <Heatmap data={heatmap} />
      </Panel>

      <ExportButton />
    </div>
  );
}
