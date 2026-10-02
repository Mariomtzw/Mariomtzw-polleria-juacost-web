import type { Metadata } from "next";
import { getInsights, getUpcomingForecasts, getModelAccuracy } from "@/lib/queries/insights";
import { formatDateShort } from "@/lib/dates";
import { InsightsPanel } from "@/components/admin/InsightCard";
import { AnalyticsActions } from "@/components/admin/AnalyticsActions";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader, SectionTitle } from "@/components/admin/ui/PageHeader";
import { currency } from "@/components/admin/charts/chart-theme";
import { FACTOR_LABEL, type FactorKey } from "@/lib/datascience/types";

export const metadata: Metadata = { title: "Analítica" };

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
    { header: "Fecha", cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span> },
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
      <PageHeader
        title="Analítica predictiva"
        description={
          <>
            Patrones de ventas cruzados con clima, quincenas, festivos y fiestas cercanas
            {accuracy.mape !== null ? ` · error del modelo: ${accuracy.mape.toFixed(0)}% (${accuracy.n} días comparados)` : ""}
          </>
        }
      />

      <section aria-labelledby="patrones-title">
        <SectionTitle id="patrones-title">Patrones detectados</SectionTitle>
        <InsightsPanel insights={insights} />
      </section>

      <section aria-labelledby="motor-title">
        <SectionTitle id="motor-title">Motor de datos</SectionTitle>
        <AnalyticsActions />
      </section>

      <section aria-labelledby="pronostico-title">
        <SectionTitle id="pronostico-title">Pronóstico de los próximos días</SectionTitle>
        <DataTable columns={columns} rows={forecasts} caption="Pronóstico de ventas por puesto" empty="Aún no hay pronósticos. Genera los primeros con el botón «Generar pronósticos»." />
      </section>
    </div>
  );
}
