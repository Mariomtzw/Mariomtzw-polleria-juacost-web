import { getInsights, getUpcomingForecasts, getModelAccuracy } from "@/lib/queries/insights";
import { InsightsPanel } from "@/components/admin/InsightCard";
import { AnalyticsActions } from "@/components/admin/AnalyticsActions";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { currency } from "@/components/admin/charts/chart-theme";
import { FACTOR_LABEL, type FactorKey } from "@/lib/datascience/types";

interface ForecastRow {
  branchName: string;
  date: string;
  predictedRev: number;
  active: FactorKey[];
}

export default async function AnaliticaPage() {
  const [insights, forecasts, accuracy] = await Promise.all([
    getInsights(),
    getUpcomingForecasts(40),
    getModelAccuracy(),
  ]);

  const columns: Column<ForecastRow>[] = [
    { header: "Fecha", cell: (r) => r.date },
    { header: "Puesto", cell: (r) => r.branchName },
    { header: "Pronóstico", cell: (r) => currency(r.predictedRev), align: "right" },
    {
      header: "Factores",
      cell: (r) =>
        r.active.length ? r.active.map((f) => FACTOR_LABEL[f]).join(", ") : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Analítica predictiva</h1>
        <p className="text-sm text-neutral-400">
          Patrones de ventas cruzados con clima, quincenas, festivos y fiestas cercanas
          {accuracy.mape !== null ? ` · error del modelo: ${accuracy.mape.toFixed(0)}% (n=${accuracy.n})` : ""}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">Patrones detectados</h2>
        <InsightsPanel insights={insights} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">Motor de datos</h2>
        <AnalyticsActions />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">Pronóstico próximos días</h2>
        <DataTable columns={columns} rows={forecasts} empty="Genera pronósticos con el botón de arriba" />
      </section>
    </div>
  );
}
