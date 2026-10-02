import { prisma } from "@/lib/prisma";
import { loadBranchContext } from "./factors";
import { getBranchSeries } from "./baseline";
import { mean } from "./stats";
import type { DayFactors, FactorKey } from "./types";

export const MODEL_VERSION = "mult-v1";

// Factores que el modelo multiplicativo aprende.
const MODEL_FACTORS: FactorKey[] = [
  "RAIN",
  "HOT",
  "COLD",
  "PAYDAY",
  "NATIONAL_HOLIDAY",
  "PATRONAL_FIESTA",
  "MUNICIPAL_FIESTA",
  "LOCAL_EVENT",
];

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export type Multipliers = Partial<Record<FactorKey, number>>;

/**
 * Modelo INTERPRETABLE (multiplicativo): aprende, por puesto, cuánto multiplica
 * cada factor las ventas respecto al baseline.
 *   multiplicador(factor) = media(ventas | factor activo) / baseline
 * Con pocos datos, un factor sin muestra suficiente queda neutro (1.0).
 */
export async function trainMultipliers(
  branchId: string,
): Promise<{ baseline: number; multipliers: Multipliers; branchName: string }> {
  const [series, ctx] = await Promise.all([getBranchSeries(branchId), loadBranchContext(branchId)]);
  const baseline = series.baseline || series.normalMean || 0;
  const multipliers: Multipliers = {};

  for (const factor of MODEL_FACTORS) {
    const group = series.rows
      .filter((r) => ctx.factorsFor(r.date).active.includes(factor))
      .map((r) => r.vendidoReal);
    if (group.length >= 2 && baseline > 0) {
      multipliers[factor] = clamp(mean(group) / baseline, 0.3, 3);
    }
  }

  return { baseline, multipliers, branchName: series.branchName };
}

/** Predice el ingreso esperado de un día combinando los multiplicadores activos. */
export function predict(baseline: number, multipliers: Multipliers, factors: DayFactors): number {
  let value = baseline;
  const applied: FactorKey[] = [];
  for (const f of factors.active) {
    const m = multipliers[f];
    if (m !== undefined) {
      value *= m;
      applied.push(f);
    }
  }
  return Math.round(value);
}

export interface ForecastRow {
  branchId: string;
  branchName: string;
  date: string;
  predictedRev: number;
  active: FactorKey[];
}

/**
 * Genera y PERSISTE pronósticos para los próximos `days` días de cada puesto,
 * usando factores de calendario ya conocidos (quincenas, festivos, fiestas) y
 * el clima que ya esté cargado en WeatherDaily (idealmente el pronóstico
 * ingerido con weatherIngest.getForecastDaily).
 */
export async function generateForecasts(days = 14): Promise<ForecastRow[]> {
  const branches = await prisma.branch.findMany({ where: { isActive: true }, select: { id: true } });
  const results: ForecastRow[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const b of branches) {
    const [{ baseline, multipliers, branchName }, ctx] = await Promise.all([
      trainMultipliers(b.id),
      loadBranchContext(b.id),
    ]);
    if (baseline <= 0) continue;

    for (let i = 1; i <= days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const factors = ctx.factorsFor(dateStr);
      const predictedRev = predict(baseline, multipliers, factors);

      await prisma.salesForecast.upsert({
        where: {
          branchId_date_modelVersion: { branchId: b.id, date: d, modelVersion: MODEL_VERSION },
        },
        create: {
          branchId: b.id,
          date: d,
          predictedRev,
          modelVersion: MODEL_VERSION,
          factors: { baseline, active: factors.active, multipliers },
        },
        update: {
          predictedRev,
          factors: { baseline, active: factors.active, multipliers },
        },
      });

      results.push({ branchId: b.id, branchName, date: dateStr, predictedRev, active: factors.active });
    }
  }

  return results;
}

/**
 * Rellena el ingreso REAL en los pronósticos pasados (para medir el error del
 * modelo). Empareja SalesForecast con DailySale por (branch, date).
 */
export async function backfillActuals(): Promise<number> {
  const forecasts = await prisma.salesForecast.findMany({
    where: { actualRev: null, modelVersion: MODEL_VERSION },
    select: { id: true, branchId: true, date: true },
  });
  let updated = 0;
  for (const f of forecasts) {
    const sale = await prisma.dailySale.findUnique({
      where: { date_branchId: { date: f.date, branchId: f.branchId } },
      select: { vendidoReal: true },
    });
    if (sale) {
      await prisma.salesForecast.update({
        where: { id: f.id },
        data: { actualRev: sale.vendidoReal },
      });
      updated++;
    }
  }
  return updated;
}
