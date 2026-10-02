import { prisma } from "@/lib/prisma";
import { equivalentesVendidos, diferenciaPollos, tierFor, getThresholds, type Tier } from "@/lib/calculations";

export interface CorteRow {
  branchName: string; sellerName: string;
  pollos: number; valorEstimado: number; vendidoReal: number;
  sobranteValor: number;      // valor del sobrante (a precio de pieza del día)
  aEntregar: number;          // dinero que debe entregar = vendidoReal
  diferenciaControl: number;  // valorEstimado - vendidoReal - sobranteValor (faltante si > 0)
  equivalentes: number; tier: Tier;
}
export interface CorteDay {
  date: string;
  rows: CorteRow[];
  totals: { aEntregar: number; sobranteValor: number; valorEstimado: number; diferencia: number };
}

type SaleSnapshot = {
  precioPechuga: { toNumber(): number }; precioPierna: { toNumber(): number }; precioAla: { toNumber(): number };
  precioHuacal: { toNumber(): number }; precioRabadilla: { toNumber(): number }; precioHigado: { toNumber(): number };
  precioPata: { toNumber(): number }; precioCabeza: { toNumber(): number };
};
function snapshotPrice(sale: SaleSnapshot, code: string): number {
  const m: Record<string, { toNumber(): number }> = {
    PECHUGA: sale.precioPechuga, PIERNA: sale.precioPierna, ALA: sale.precioAla, HUACAL: sale.precioHuacal,
    RABADILLA: sale.precioRabadilla, HIGADO: sale.precioHigado, PATA: sale.precioPata, CABEZA: sale.precioCabeza,
  };
  return m[code] ? m[code].toNumber() : 0;
}

/** Corte diario: cuánto debe entregar cada vendedora según lo vendido y su sobrante. */
export async function getCorte(dateStr: string): Promise<CorteDay> {
  const date = new Date(`${dateStr}T00:00:00`);
  const [sales, leftovers, thresholds] = await Promise.all([
    prisma.dailySale.findMany({
      where: { date },
      orderBy: { branch: { code: "asc" } },
      include: { branch: { select: { name: true } }, seller: { select: { name: true } } },
    }),
    prisma.leftover.findMany({ where: { date }, include: { pieceType: { select: { code: true } } } }),
    getThresholds(),
  ]);

  const saleByBranch = new Map(sales.map((s) => [s.branchId, s]));
  const sobranteByBranch = new Map<string, number>();
  for (const l of leftovers) {
    const sale = saleByBranch.get(l.branchId);
    let price = l.unitPrice ? l.unitPrice.toNumber() : 0;
    if (!price && sale) price = snapshotPrice(sale, l.pieceType.code);
    sobranteByBranch.set(l.branchId, (sobranteByBranch.get(l.branchId) ?? 0) + l.quantity.toNumber() * price);
  }

  const rows: CorteRow[] = sales.map((s) => {
    const ppp = s.precioPorPieza.toNumber();
    const vr = s.vendidoReal.toNumber();
    const ve = s.valorEstimado.toNumber();
    const eq = equivalentesVendidos(vr, ppp);
    const dif = diferenciaPollos(s.pollosAsignados.toNumber(), eq);
    const sobV = sobranteByBranch.get(s.branchId) ?? 0;
    return {
      branchName: s.branch.name, sellerName: s.seller.name,
      pollos: s.pollosAsignados.toNumber(), valorEstimado: ve, vendidoReal: vr,
      sobranteValor: sobV, aEntregar: vr, diferenciaControl: ve - vr - sobV,
      equivalentes: eq, tier: tierFor(dif, thresholds),
    };
  });

  const totals = rows.reduce(
    (a, r) => ({
      aEntregar: a.aEntregar + r.aEntregar, sobranteValor: a.sobranteValor + r.sobranteValor,
      valorEstimado: a.valorEstimado + r.valorEstimado, diferencia: a.diferencia + r.diferenciaControl,
    }),
    { aEntregar: 0, sobranteValor: 0, valorEstimado: 0, diferencia: 0 },
  );
  return { date: dateStr, rows, totals };
}
