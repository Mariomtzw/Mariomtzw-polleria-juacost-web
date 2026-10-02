import { NextResponse } from "next/server";
import { ingestForecastWeather } from "@/lib/datascience/weatherIngest";
import { generateForecasts, backfillActuals } from "@/lib/datascience/forecast";

// Esta ruta la invoca el Cron de Vercel de madrugada. NO usa assertOwner
// (no hay sesión de usuario); se protege con CRON_SECRET.
export const dynamic = "force-dynamic";
export const maxDuration = 60; // segundos (ajusta según tu plan de Vercel)

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;

  // 1) El secreto DEBE existir en el entorno (si no, es un error de config).
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }

  // 2) Vercel Cron envía "Authorization: Bearer <CRON_SECRET>" automáticamente.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const weatherDays = await ingestForecastWeather(14); // pronóstico de clima
    const forecasts = await generateForecasts(14); // (re)entrena y persiste
    const actuals = await backfillActuals(); // empareja reales pasados

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      weatherDays,
      forecasts: forecasts.length,
      actuals,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
