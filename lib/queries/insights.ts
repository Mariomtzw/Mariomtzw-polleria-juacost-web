import { prisma } from "@/lib/prisma";
import { analyzeAllBranches } from "@/lib/datascience/patterns";
import { MODEL_VERSION } from "@/lib/datascience/forecast";
import type { Insight, FactorKey } from "@/lib/datascience/types";

export type { Insight };

/** Patrones detectados en todos los puestos (para las tarjetas). */
export async function getInsights(): Promise<Insight[]> {
  return analyzeAllBranches();
}

export interface UpcomingForecast {
  branchName: string;
  date: string;
  predictedRev: number;
  active: FactorKey[];
}

/** Pronósticos futuros ya persistidos. */
export async function getUpcomingForecasts(limit = 40): Promise<UpcomingForecast[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await prisma.salesForecast.findMany({
    where: { modelVersion: MODEL_VERSION, date: { gte: today } },
    orderBy: [{ date: "asc" }],
    take: limit,
    select: {
      date: true,
      predictedRev: true,
      factors: true,
      branch: { select: { name: true } },
    },
  });

  return rows.map((r) => {
    const f = (r.factors ?? {}) as { active?: FactorKey[] };
    return {
      branchName: r.branch.name,
      date: r.date.toISOString().slice(0, 10),
      predictedRev: r.predictedRev ? r.predictedRev.toNumber() : 0,
      active: f.active ?? [],
    };
  });
}

export interface ModelAccuracy {
  mape: number | null; // error porcentual medio absoluto
  n: number;
}

/** Precisión del modelo comparando predicho vs real (donde ya hay real). */
export async function getModelAccuracy(): Promise<ModelAccuracy> {
  const rows = await prisma.salesForecast.findMany({
    where: { modelVersion: MODEL_VERSION, actualRev: { not: null } },
    select: { predictedRev: true, actualRev: true },
  });
  if (rows.length === 0) return { mape: null, n: 0 };

  let sum = 0;
  let n = 0;
  for (const r of rows) {
    const pred = r.predictedRev ? r.predictedRev.toNumber() : 0;
    const actual = r.actualRev ? r.actualRev.toNumber() : 0;
    if (actual > 0) {
      sum += Math.abs(pred - actual) / actual;
      n++;
    }
  }
  return { mape: n > 0 ? (sum / n) * 100 : null, n };
}
