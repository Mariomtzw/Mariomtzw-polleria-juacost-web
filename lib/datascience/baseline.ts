import { prisma } from "@/lib/prisma";
import { loadBranchContext } from "./factors";
import { median, mean } from "./stats";

export interface BranchSeries {
  branchId: string;
  branchName: string;
  rows: Array<{ date: string; vendidoReal: number }>;
  baseline: number; // mediana de ventas en días "normales" (sin factores)
  normalMean: number; // media en días normales
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Serie de ventas de un puesto + su BASELINE = mediana de "días normales"
 * (sin lluvia, sin quincena, sin festivo, sin fiesta cercana). Ese baseline es
 * la referencia contra la que medimos el efecto de cada factor.
 */
export async function getBranchSeries(branchId: string): Promise<BranchSeries> {
  const [branch, sales, ctx] = await Promise.all([
    prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { name: true } }),
    prisma.dailySale.findMany({
      where: { branchId },
      orderBy: { date: "asc" },
      select: { date: true, vendidoReal: true },
    }),
    loadBranchContext(branchId),
  ]);

  const rows = sales.map((s) => ({ date: ymd(s.date), vendidoReal: s.vendidoReal.toNumber() }));

  const normal = rows.filter((r) => ctx.factorsFor(r.date).active.length === 0).map((r) => r.vendidoReal);
  // Si no hay suficientes días "normales", usamos toda la serie como respaldo.
  const source = normal.length >= 3 ? normal : rows.map((r) => r.vendidoReal);

  return {
    branchId,
    branchName: branch.name,
    rows,
    baseline: median(source),
    normalMean: mean(source),
  };
}
