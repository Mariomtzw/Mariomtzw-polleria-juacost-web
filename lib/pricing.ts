import { prisma } from "@/lib/prisma";

/**
 * Los 8 precios de despiece. Es la única fuente de verdad de la fórmula
 * de negocio (idéntica a la de tu Excel).
 */
export interface PiecePrices {
  precioPechuga: number;
  precioPierna: number;
  precioAla: number;
  precioHuacal: number;
  precioRabadilla: number;
  precioHigado: number;
  precioPata: number;
  precioCabeza: number;
}

/**
 * precioPorPieza = pechuga + 2·pierna + 2·ala + huacal + rabadilla + higado + 2·pata + cabeza
 * (pierna, ala y pata cuentan x2 por pollo).
 */
export function precioPorPieza(p: PiecePrices): number {
  return (
    p.precioPechuga +
    2 * p.precioPierna +
    2 * p.precioAla +
    p.precioHuacal +
    p.precioRabadilla +
    p.precioHigado +
    2 * p.precioPata +
    p.precioCabeza
  );
}

/**
 * Obtiene la lista de precios vigente de un puesto (la activa más reciente).
 * Devuelve los 8 precios como números listos para usar como "valor por defecto"
 * en la captura diaria.
 */
export async function getActivePriceList(branchId: string): Promise<PiecePrices | null> {
  const pl = await prisma.priceList.findFirst({
    where: { branchId, isActive: true },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!pl) return null;
  return {
    precioPechuga: pl.precioPechuga.toNumber(),
    precioPierna: pl.precioPierna.toNumber(),
    precioAla: pl.precioAla.toNumber(),
    precioHuacal: pl.precioHuacal.toNumber(),
    precioRabadilla: pl.precioRabadilla.toNumber(),
    precioHigado: pl.precioHigado.toNumber(),
    precioPata: pl.precioPata.toNumber(),
    precioCabeza: pl.precioCabeza.toNumber(),
  };
}
