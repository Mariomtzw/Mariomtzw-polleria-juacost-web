import { prisma } from "@/lib/prisma";
import type { DayFactors, FactorKey, NearbyFiesta } from "./types";

// Umbrales de clasificación (ajustables). Podrían moverse a AppSetting.
export const FACTOR_THRESHOLDS = {
  rainMm: 1, // >= 1 mm => día lluvioso
  hotC: 30, // >= 30 °C => calor
  coldC: 12, // <= 12 °C => frío
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Quincena: día 15 o último día del mes. */
export function isPayday(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDate();
  if (day === 15) return true;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return day === last;
}

const EVENT_FACTOR: Record<string, FactorKey> = {
  PATRONAL_FIESTA: "PATRONAL_FIESTA",
  MUNICIPAL_FIESTA: "MUNICIPAL_FIESTA",
  LOCAL_EVENT: "LOCAL_EVENT",
};

/**
 * Contexto de un puesto: mapas de clima, festivos nacionales y fiestas cercanas,
 * cargados una vez para evaluar muchas fechas sin N+1 queries.
 */
export interface BranchContext {
  branchId: string;
  factorsFor: (dateStr: string) => DayFactors;
}

export async function loadBranchContext(branchId: string): Promise<BranchContext> {
  const [weather, holidays, impacts] = await Promise.all([
    prisma.weatherDaily.findMany({
      where: { branchId },
      select: { date: true, precipitationMm: true, tempAvgC: true },
    }),
    prisma.calendarEvent.findMany({
      where: { type: "NATIONAL_HOLIDAY" },
      select: { startDate: true, endDate: true },
    }),
    prisma.eventBranchImpact.findMany({
      where: { branchId },
      select: {
        distanceKm: true,
        event: { select: { name: true, type: true, startDate: true, endDate: true } },
      },
    }),
  ]);

  const weatherByDate = new Map(
    weather.map((w) => [ymd(w.date), { mm: w.precipitationMm, temp: w.tempAvgC }]),
  );

  const inRange = (d: string, start: Date, end: Date | null): boolean => {
    const t = new Date(`${d}T00:00:00`).getTime();
    const s = new Date(ymd(start) + "T00:00:00").getTime();
    const e = new Date(ymd(end ?? start) + "T00:00:00").getTime();
    return t >= s && t <= e;
  };

  const factorsFor = (dateStr: string): DayFactors => {
    const w = weatherByDate.get(dateStr) ?? { mm: null, temp: null };
    const rain = w.mm !== null && w.mm >= FACTOR_THRESHOLDS.rainMm;
    const hot = w.temp !== null && w.temp >= FACTOR_THRESHOLDS.hotC;
    const cold = w.temp !== null && w.temp <= FACTOR_THRESHOLDS.coldC;
    const payday = isPayday(dateStr);
    const nationalHoliday = holidays.some((h) => inRange(dateStr, h.startDate, h.endDate));

    const fiestas: NearbyFiesta[] = impacts
      .filter((i) => inRange(dateStr, i.event.startDate, i.event.endDate))
      .map((i) => ({
        name: i.event.name,
        factor: EVENT_FACTOR[i.event.type] ?? "LOCAL_EVENT",
        distanceKm: i.distanceKm,
      }));

    const active: FactorKey[] = [];
    if (rain) active.push("RAIN");
    if (hot) active.push("HOT");
    if (cold) active.push("COLD");
    if (payday) active.push("PAYDAY");
    if (nationalHoliday) active.push("NATIONAL_HOLIDAY");
    for (const f of fiestas) if (!active.includes(f.factor)) active.push(f.factor);

    return {
      date: dateStr,
      branchId,
      precipitationMm: w.mm,
      tempAvgC: w.temp,
      rain,
      hot,
      cold,
      payday,
      nationalHoliday,
      fiestas,
      active,
    };
  };

  return { branchId, factorsFor };
}
