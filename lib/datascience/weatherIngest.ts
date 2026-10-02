import { prisma } from "@/lib/prisma";
import type { WeatherCondition } from "@prisma/client";

// Open-Meteo (gratis, sin API key).
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const DAILY = "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code";

interface OpenMeteoDaily {
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
    weather_code: (number | null)[];
  };
}

/** Traduce el WMO weather_code a nuestra enum de condición. */
function toCondition(code: number | null, precip: number | null): WeatherCondition {
  if (code === null) return precip && precip >= 1 ? "RAIN" : "OTHER";
  if (code === 0) return "CLEAR";
  if (code >= 1 && code <= 3) return "CLOUDS";
  if (code >= 45 && code <= 48) return "FOG";
  if (code >= 51 && code <= 67) return "RAIN";
  if (code >= 80 && code <= 82) return "RAIN";
  if (code >= 95) return "STORM";
  return "OTHER";
}

async function fetchDaily(url: string): Promise<OpenMeteoDaily> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return (await res.json()) as OpenMeteoDaily;
}

async function upsertDays(
  branchId: string,
  data: OpenMeteoDaily,
  source: string,
): Promise<number> {
  const d = data.daily;
  if (!d) return 0;
  let n = 0;
  for (let i = 0; i < d.time.length; i++) {
    const date = new Date(`${d.time[i]}T00:00:00`);
    const tMax = d.temperature_2m_max[i];
    const tMin = d.temperature_2m_min[i];
    const precip = d.precipitation_sum[i];
    const tAvg = tMax !== null && tMin !== null ? (tMax + tMin) / 2 : null;

    await prisma.weatherDaily.upsert({
      where: { branchId_date: { branchId, date } },
      create: {
        branchId,
        date,
        tempMaxC: tMax,
        tempMinC: tMin,
        tempAvgC: tAvg,
        precipitationMm: precip,
        condition: toCondition(d.weather_code[i], precip),
        source,
      },
      update: {
        tempMaxC: tMax,
        tempMinC: tMin,
        tempAvgC: tAvg,
        precipitationMm: precip,
        condition: toCondition(d.weather_code[i], precip),
        source,
      },
    });
    n++;
  }
  return n;
}

/**
 * Backfill de clima histórico para todos los puestos con coordenadas.
 * Llama al archive-api de Open-Meteo por cada puesto en el rango dado.
 */
export async function backfillHistoricalWeather(startDate: string, endDate: string): Promise<number> {
  const branches = await prisma.branch.findMany({
    where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    select: { id: true, latitude: true, longitude: true },
  });

  let total = 0;
  for (const b of branches) {
    const url =
      `${ARCHIVE}?latitude=${b.latitude}&longitude=${b.longitude}` +
      `&start_date=${startDate}&end_date=${endDate}&daily=${DAILY}&timezone=auto`;
    const data = await fetchDaily(url);
    total += await upsertDays(b.id, data, "open-meteo-archive");
  }
  return total;
}

/**
 * Ingiere el PRONÓSTICO de clima (próximos días) para todos los puestos,
 * de modo que el modelo pueda usarlo al generar SalesForecast.
 */
export async function ingestForecastWeather(days = 14): Promise<number> {
  const branches = await prisma.branch.findMany({
    where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    select: { id: true, latitude: true, longitude: true },
  });

  let total = 0;
  for (const b of branches) {
    const url =
      `${FORECAST}?latitude=${b.latitude}&longitude=${b.longitude}` +
      `&daily=${DAILY}&forecast_days=${Math.min(days, 16)}&timezone=auto`;
    const data = await fetchDaily(url);
    total += await upsertDays(b.id, data, "open-meteo-forecast");
  }
  return total;
}
