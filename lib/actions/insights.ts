"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwner } from "@/lib/auth-guards";
import { backfillHistoricalWeather, ingestForecastWeather } from "@/lib/datascience/weatherIngest";
import { seedNationalHolidays, addFiesta } from "@/lib/datascience/calendarSeed";
import { generateForecasts, backfillActuals } from "@/lib/datascience/forecast";
import type { ActionResult } from "@/lib/actions/sales";

/**
 * Pipeline completo: ingiere el pronóstico de clima, (re)entrena y persiste
 * los SalesForecast de los próximos días, y rellena los reales ya conocidos.
 */
export async function refreshForecasts(days = 14): Promise<ActionResult<{ forecasts: number; actuals: number }>> {
  await assertOwner();
  try {
    await ingestForecastWeather(days);
    const rows = await generateForecasts(days);
    const actuals = await backfillActuals();
    revalidatePath("/admin/analitica");
    revalidatePath("/admin");
    return { ok: true, data: { forecasts: rows.length, actuals } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Backfill de clima histórico + festivos nacionales para el rango dado. */
export async function backfillWeatherAndHolidays(
  startDate: string,
  endDate: string,
): Promise<ActionResult<{ weatherDays: number; holidays: number }>> {
  await assertOwner();
  const range = z
    .object({ startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .safeParse({ startDate, endDate });
  if (!range.success) return { ok: false, error: "Rango de fechas inválido" };

  try {
    const weatherDays = await backfillHistoricalWeather(startDate, endDate);
    const y1 = Number(startDate.slice(0, 4));
    const y2 = Number(endDate.slice(0, 4));
    let holidays = 0;
    for (let y = y1; y <= y2; y++) holidays += await seedNationalHolidays(y);

    revalidatePath("/admin/analitica");
    return { ok: true, data: { weatherDays, holidays } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

const fiestaSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["PATRONAL_FIESTA", "MUNICIPAL_FIESTA", "LOCAL_EVENT"]),
  town: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  radiusKm: z.coerce.number().positive().optional(),
});

/** Alta de fiesta patronal/municipal, enlazando puestos cercanos por distancia. */
export async function createFiesta(formData: FormData): Promise<ActionResult<{ linkedBranches: number }>> {
  await assertOwner();
  const parsed = fiestaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const { linkedBranches } = await addFiesta({
      ...parsed.data,
      endDate: parsed.data.endDate ? parsed.data.endDate : undefined,
    });
    revalidatePath("/admin/analitica");
    return { ok: true, data: { linkedBranches } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
