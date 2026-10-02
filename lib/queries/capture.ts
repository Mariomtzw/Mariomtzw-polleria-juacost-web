import { prisma } from "@/lib/prisma";
import { getActivePriceList, precioPorPieza } from "@/lib/pricing";
import { getThresholds, type TierThresholds } from "@/lib/calculations";

export interface CaptureRow {
  branchId: string;
  branchName: string;
  sellerId: string | null;
  pollosAsignados: number | null;
  valorEstimado: number | null;
  vendidoReal: number | null;
  precioPorPieza: number; // snapshot existente o precio vigente del puesto
  hasSale: boolean;
}

export interface DayCapture {
  date: string;
  sellers: { id: string; name: string }[];
  rows: CaptureRow[];
  thresholds: TierThresholds;
}

/** Arma la vista de captura de un día: los 9 puestos como filas, con lo ya
 * registrado (si existe) y el precio por pieza vigente para calcular en vivo. */
export async function getDayCapture(dateStr: string): Promise<DayCapture> {
  const date = new Date(`${dateStr}T00:00:00`);
  const [branches, sellers, thresholds] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, name: true } }),
    prisma.seller.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getThresholds(),
  ]);

  const rows: CaptureRow[] = [];
  for (const b of branches) {
    const [sale, prices] = await Promise.all([
      prisma.dailySale.findUnique({
        where: { date_branchId: { date, branchId: b.id } },
        select: { sellerId: true, pollosAsignados: true, valorEstimado: true, vendidoReal: true, precioPorPieza: true },
      }),
      getActivePriceList(b.id),
    ]);
    const ppp = sale ? sale.precioPorPieza.toNumber() : prices ? precioPorPieza(prices) : 0;
    rows.push({
      branchId: b.id,
      branchName: b.name,
      sellerId: sale?.sellerId ?? null,
      pollosAsignados: sale ? sale.pollosAsignados.toNumber() : null,
      valorEstimado: sale ? sale.valorEstimado.toNumber() : null,
      vendidoReal: sale ? sale.vendidoReal.toNumber() : null,
      precioPorPieza: ppp,
      hasSale: Boolean(sale),
    });
  }

  return { date: dateStr, sellers, rows, thresholds };
}
