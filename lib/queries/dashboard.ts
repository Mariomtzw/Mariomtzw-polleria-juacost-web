import { prisma } from "@/lib/prisma";

function startNDaysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
const pctDelta = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

export interface KpiDelta { cur: number; prev: number; deltaPct: number | null }
export interface KpiDeltas {
  vendido: KpiDelta;
  estimado: KpiDelta;
  pollos: KpiDelta;
}

/** Totales del periodo actual vs. el periodo inmediatamente anterior (misma
 * duración) para mostrar la variación %. */
export async function getKpiDeltas(rangeDays = 30): Promise<KpiDeltas> {
  const start = startNDaysAgo(rangeDays);
  const prevStart = startNDaysAgo(rangeDays * 2);
  const sales = await prisma.dailySale.findMany({
    where: { date: { gte: prevStart } },
    select: { date: true, vendidoReal: true, valorEstimado: true, pollosAsignados: true },
  });
  let cV = 0, pV = 0, cE = 0, pE = 0, cP = 0, pP = 0;
  for (const s of sales) {
    const inCur = s.date >= start;
    const v = s.vendidoReal.toNumber(), e = s.valorEstimado.toNumber(), p = s.pollosAsignados.toNumber();
    if (inCur) { cV += v; cE += e; cP += p; } else { pV += v; pE += e; pP += p; }
  }
  return {
    vendido: { cur: cV, prev: pV, deltaPct: pctDelta(cV, pV) },
    estimado: { cur: cE, prev: pE, deltaPct: pctDelta(cE, pE) },
    pollos: { cur: cP, prev: pP, deltaPct: pctDelta(cP, pP) },
  };
}

export interface Heatmap {
  branches: string[];
  dates: string[];
  matrix: number[][]; // [branch][date] = vendidoReal
  max: number;
}

/** Matriz puesto × día de Vendido Real, para el heatmap tipo BI. */
export async function getHeatmap(days = 14): Promise<Heatmap> {
  const start = startNDaysAgo(days - 1);
  const [branches, sales] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, name: true } }),
    prisma.dailySale.findMany({ where: { date: { gte: start } }, select: { date: true, branchId: true, vendidoReal: true } }),
  ]);

  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const bIndex = new Map(branches.map((b, i) => [b.id, i]));
  const dIndex = new Map(dates.map((d, i) => [d, i]));
  const matrix = branches.map(() => dates.map(() => 0));
  let max = 0;
  for (const s of sales) {
    const bi = bIndex.get(s.branchId);
    const di = dIndex.get(s.date.toISOString().slice(0, 10));
    if (bi == null || di == null) continue;
    matrix[bi][di] += s.vendidoReal.toNumber();
    if (matrix[bi][di] > max) max = matrix[bi][di];
  }
  return { branches: branches.map((b) => b.name), dates, matrix, max };
}
