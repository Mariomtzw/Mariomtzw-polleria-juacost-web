import { prisma } from "@/lib/prisma";
import {
  diferenciaPollos,
  equivalentesVendidos,
  getThresholds,
  tierFor,
  type Tier,
} from "@/lib/calculations";

// Todos los tipos de retorno son datos planos serializables (aptos para
// pasar de un Server Component a un Client Component de Recharts).

export interface TrendPoint {
  date: string; // "YYYY-MM-DD"
  valorEstimado: number;
  vendidoReal: number;
}

export interface BranchRank {
  branchId: string;
  name: string;
  vendidoReal: number;
  pollosAsignados: number;
}

export interface SellerRank {
  sellerId: string;
  name: string;
  equivalentes: number; // pollos equivalentes vendidos (promedio diario)
  diferencia: number; // promedio de diferencia
  tier: Tier; // semáforo
}

export interface DashboardTotals {
  vendidoReal: number;
  valorEstimado: number;
  pollosAsignados: number;
  dias: number;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/** Tendencia diaria: Valor Estimado vs Vendido Real (una fila por día). */
export async function getSalesTrend(rangeDays = 90): Promise<TrendPoint[]> {
  const sales = await prisma.dailySale.findMany({
    where: { date: { gte: daysAgo(rangeDays) } },
    orderBy: { date: "asc" },
    select: { date: true, valorEstimado: true, vendidoReal: true },
  });

  const byDate = new Map<string, TrendPoint>();
  for (const s of sales) {
    const key = s.date.toISOString().slice(0, 10);
    const acc = byDate.get(key) ?? { date: key, valorEstimado: 0, vendidoReal: 0 };
    acc.valorEstimado += s.valorEstimado.toNumber();
    acc.vendidoReal += s.vendidoReal.toNumber();
    byDate.set(key, acc);
  }
  return [...byDate.values()];
}

/** Ranking de sucursales por Vendido Real (dónde se vende más). */
export async function getBranchRanking(rangeDays = 90): Promise<BranchRank[]> {
  const sales = await prisma.dailySale.findMany({
    where: { date: { gte: daysAgo(rangeDays) } },
    select: {
      branchId: true,
      vendidoReal: true,
      pollosAsignados: true,
      branch: { select: { name: true } },
    },
  });

  const byBranch = new Map<string, BranchRank>();
  for (const s of sales) {
    const acc =
      byBranch.get(s.branchId) ??
      { branchId: s.branchId, name: s.branch.name, vendidoReal: 0, pollosAsignados: 0 };
    acc.vendidoReal += s.vendidoReal.toNumber();
    acc.pollosAsignados += s.pollosAsignados.toNumber();
    byBranch.set(s.branchId, acc);
  }
  return [...byBranch.values()].sort((a, b) => b.vendidoReal - a.vendidoReal);
}

/** Ranking de vendedoras con semáforo (promedio de diferencia por día). */
export async function getSellerRanking(rangeDays = 90): Promise<SellerRank[]> {
  const thresholds = await getThresholds();
  const sales = await prisma.dailySale.findMany({
    where: { date: { gte: daysAgo(rangeDays) } },
    select: {
      sellerId: true,
      pollosAsignados: true,
      vendidoReal: true,
      precioPorPieza: true,
      seller: { select: { name: true } },
    },
  });

  const acc = new Map<string, { name: string; difSum: number; eqSum: number; n: number }>();
  for (const s of sales) {
    const eq = equivalentesVendidos(s.vendidoReal.toNumber(), s.precioPorPieza.toNumber());
    const dif = diferenciaPollos(s.pollosAsignados.toNumber(), eq);
    const cur = acc.get(s.sellerId) ?? { name: s.seller.name, difSum: 0, eqSum: 0, n: 0 };
    cur.difSum += dif;
    cur.eqSum += eq;
    cur.n += 1;
    acc.set(s.sellerId, cur);
  }

  const result: SellerRank[] = [...acc.entries()].map(([sellerId, v]) => {
    const diferencia = v.n > 0 ? v.difSum / v.n : 0;
    return {
      sellerId,
      name: v.name,
      equivalentes: v.n > 0 ? v.eqSum / v.n : 0,
      diferencia,
      tier: tierFor(diferencia, thresholds),
    };
  });

  // Mejor vendedora primero (menor diferencia = mejor).
  return result.sort((a, b) => a.diferencia - b.diferencia);
}

/** Totales para las stat tiles del dashboard. */
export async function getDashboardTotals(rangeDays = 90): Promise<DashboardTotals> {
  const sales = await prisma.dailySale.findMany({
    where: { date: { gte: daysAgo(rangeDays) } },
    select: { date: true, valorEstimado: true, vendidoReal: true, pollosAsignados: true },
  });
  const dias = new Set(sales.map((s) => s.date.toISOString().slice(0, 10))).size;
  return {
    vendidoReal: sales.reduce((a, s) => a + s.vendidoReal.toNumber(), 0),
    valorEstimado: sales.reduce((a, s) => a + s.valorEstimado.toNumber(), 0),
    pollosAsignados: sales.reduce((a, s) => a + s.pollosAsignados.toNumber(), 0),
    dias,
  };
}
