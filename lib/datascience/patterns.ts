import { prisma } from "@/lib/prisma";
import { loadBranchContext } from "./factors";
import { getBranchSeries } from "./baseline";
import { compareGroups } from "./stats";
import { FACTOR_LABEL, type FactorKey, type Insight } from "./types";

const pct = (n: number) => Math.round(n);

function directionOf(pctChange: number): "up" | "down" | "flat" {
  if (pctChange >= 3) return "up";
  if (pctChange <= -3) return "down";
  return "flat";
}

/** Frase en español para una tarjeta de insight. */
function buildText(branchName: string, factor: FactorKey, dir: "up" | "down" | "flat", pctChange: number, n: number, eventName?: string): string {
  const label = eventName ?? FACTOR_LABEL[factor].toLowerCase();
  const verb = dir === "up" ? "suben" : dir === "down" ? "bajan" : "no cambian";
  const magnitude = dir === "flat" ? "" : ` un ${Math.abs(pct(pctChange))}%`;
  const when =
    factor === "RAIN" ? "Cuando llueve"
    : factor === "PAYDAY" ? "En quincena"
    : factor === "NATIONAL_HOLIDAY" ? "En días festivos"
    : `Durante ${label}`;
  return `${when}, las ventas en ${branchName} ${verb}${magnitude} (${n} días observados).`;
}

/**
 * Analiza un puesto y devuelve los patrones detectados (lluvia, quincena,
 * festivo, y cada tipo de fiesta cercana), comparando contra el baseline.
 */
export async function analyzeBranch(branchId: string): Promise<Insight[]> {
  const [series, ctx] = await Promise.all([getBranchSeries(branchId), loadBranchContext(branchId)]);
  if (series.rows.length < 4) return []; // datos insuficientes

  const insights: Insight[] = [];

  // Ventas de días "normales" = base de comparación.
  const baseSales = series.rows
    .filter((r) => ctx.factorsFor(r.date).active.length === 0)
    .map((r) => r.vendidoReal);
  const baseline = baseSales.length >= 3 ? baseSales : series.rows.map((r) => r.vendidoReal);

  const simpleFactors: FactorKey[] = ["RAIN", "PAYDAY", "NATIONAL_HOLIDAY", "PATRONAL_FIESTA", "MUNICIPAL_FIESTA", "LOCAL_EVENT"];

  for (const factor of simpleFactors) {
    const group = series.rows
      .filter((r) => ctx.factorsFor(r.date).active.includes(factor))
      .map((r) => r.vendidoReal);
    if (group.length < 2) continue; // muy pocos días con este factor

    const cmp = compareGroups(baseline, group);
    const dir = directionOf(cmp.pctChange);
    if (dir === "flat") continue; // sin efecto relevante

    insights.push({
      id: `${branchId}:${factor}`,
      scope: "branch",
      branchId,
      branchName: series.branchName,
      factor,
      direction: dir,
      pctChange: pct(cmp.pctChange),
      baseMean: Math.round(cmp.baseMean),
      groupMean: Math.round(cmp.groupMean),
      nDays: group.length,
      confidence: cmp.confidence,
      text: buildText(series.branchName, factor, dir, cmp.pctChange, group.length),
    });
  }

  // Ordena por magnitud y confianza (los efectos fuertes y confiables primero).
  const rank = { high: 3, med: 2, low: 1 };
  return insights.sort(
    (a, b) => rank[b.confidence] - rank[a.confidence] || Math.abs(b.pctChange) - Math.abs(a.pctChange),
  );
}

/** Analiza todos los puestos activos. */
export async function analyzeAllBranches(): Promise<Insight[]> {
  const branches = await prisma.branch.findMany({ where: { isActive: true }, select: { id: true } });
  const all = await Promise.all(branches.map((b) => analyzeBranch(b.id)));
  return all.flat();
}
