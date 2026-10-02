import { prisma } from "@/lib/prisma";

export type Tier = "GREEN" | "YELLOW" | "RED";

export interface TierThresholds {
  greenMax: number; // diferencia < greenMax => verde
  yellowMax: number; // diferencia < yellowMax => amarillo; si no => rojo
}

export const DEFAULT_THRESHOLDS: TierThresholds = { greenMax: 1, yellowMax: 5 };

/**
 * Equivalente en pollos realmente vendidos = vendidoReal / precioPorPieza.
 * (idéntico a la columna del Excel).
 */
export function equivalentesVendidos(vendidoReal: number, precioPorPieza: number): number {
  return precioPorPieza > 0 ? vendidoReal / precioPorPieza : 0;
}

/** Diferencia esperado vs vendido = pollosAsignados − equivalentesVendidos. */
export function diferenciaPollos(pollosAsignados: number, equivalentes: number): number {
  return pollosAsignados - equivalentes;
}

/** Semáforo de rendimiento (verde/amarillo/rojo) según los umbrales. */
export function tierFor(diferencia: number, t: TierThresholds = DEFAULT_THRESHOLDS): Tier {
  if (diferencia < t.greenMax) return "GREEN";
  if (diferencia < t.yellowMax) return "YELLOW";
  return "RED";
}

/** Lee los umbrales del semáforo desde AppSetting (con valores por defecto). */
export async function getThresholds(): Promise<TierThresholds> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ["tier.green.max", "tier.yellow.max"] } },
  });
  const map = new Map(rows.map((r) => [r.key, Number(r.value)]));
  return {
    greenMax: map.get("tier.green.max") ?? DEFAULT_THRESHOLDS.greenMax,
    yellowMax: map.get("tier.yellow.max") ?? DEFAULT_THRESHOLDS.yellowMax,
  };
}
