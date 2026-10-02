import { prisma } from "@/lib/prisma";
import { precioPorPieza } from "@/lib/pricing";

export interface FreshPrices {
  precioPechuga: number; precioPierna: number; precioAla: number; precioHuacal: number;
  precioRabadilla: number; precioHigado: number; precioPata: number; precioCabeza: number;
}
export interface FreshPriceBranch {
  branchId: string; name: string; prices: FreshPrices | null; precioPorPieza: number | null;
}

/** Precios de pieza (fresco) VIGENTES por puesto, para el editor tipo rejilla. */
export async function getAllFreshPrices(): Promise<FreshPriceBranch[]> {
  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, name: true } });
  const out: FreshPriceBranch[] = [];
  for (const b of branches) {
    const pl = await prisma.priceList.findFirst({ where: { branchId: b.id, isActive: true }, orderBy: { effectiveFrom: "desc" } });
    if (pl) {
      const prices: FreshPrices = {
        precioPechuga: pl.precioPechuga.toNumber(), precioPierna: pl.precioPierna.toNumber(),
        precioAla: pl.precioAla.toNumber(), precioHuacal: pl.precioHuacal.toNumber(),
        precioRabadilla: pl.precioRabadilla.toNumber(), precioHigado: pl.precioHigado.toNumber(),
        precioPata: pl.precioPata.toNumber(), precioCabeza: pl.precioCabeza.toNumber(),
      };
      out.push({ branchId: b.id, name: b.name, prices, precioPorPieza: precioPorPieza(prices) });
    } else {
      out.push({ branchId: b.id, name: b.name, prices: null, precioPorPieza: null });
    }
  }
  return out;
}
