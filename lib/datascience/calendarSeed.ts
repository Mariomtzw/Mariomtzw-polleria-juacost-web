import { prisma } from "@/lib/prisma";
import { haversineKm } from "./stats";
import type { EventType } from "@prisma/client";

// ─── Festivos nacionales de México (fechas fijas y algunas oficiales) ───
// Nota: los "puente" (lunes) varían por año; aquí se listan las fechas base.
function mexicanHolidays(year: number): Array<{ name: string; date: string }> {
  return [
    { name: "Año Nuevo", date: `${year}-01-01` },
    { name: "Día de la Constitución", date: `${year}-02-05` },
    { name: "Natalicio de Benito Juárez", date: `${year}-03-21` },
    { name: "Día del Trabajo", date: `${year}-05-01` },
    { name: "Independencia de México", date: `${year}-09-16` },
    { name: "Día de Muertos", date: `${year}-11-02` },
    { name: "Revolución Mexicana", date: `${year}-11-20` },
    { name: "Día de la Virgen de Guadalupe", date: `${year}-12-12` },
    { name: "Navidad", date: `${year}-12-25` },
  ];
}

/** Inserta los festivos nacionales del año (idempotente por nombre+fecha). */
export async function seedNationalHolidays(year: number): Promise<number> {
  const holidays = mexicanHolidays(year);
  let n = 0;
  for (const h of holidays) {
    const date = new Date(`${h.date}T00:00:00`);
    const exists = await prisma.calendarEvent.findFirst({
      where: { name: h.name, type: "NATIONAL_HOLIDAY", startDate: date },
    });
    if (!exists) {
      await prisma.calendarEvent.create({
        data: { name: h.name, type: "NATIONAL_HOLIDAY", startDate: date, source: "seed" },
      });
      n++;
    }
  }
  return n;
}

/**
 * Nota sobre quincenas: NO se guardan como eventos; se detectan por fórmula
 * (día 15 y último del mes) en `factors.isPayday`. Así no ensuciamos la tabla.
 */

/**
 * Alta de una fiesta patronal/municipal/local. Enlaza automáticamente los
 * puestos dentro de `radiusKm` calculando la distancia (haversine) desde las
 * coordenadas del evento — así "las fiestas de pueblos cercanos" afectan solo
 * a los puestos correspondientes.
 */
export async function addFiesta(params: {
  name: string;
  type: Extract<EventType, "PATRONAL_FIESTA" | "MUNICIPAL_FIESTA" | "LOCAL_EVENT">;
  town?: string;
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  radiusKm?: number; // default 15 km
}): Promise<{ eventId: string; linkedBranches: number }> {
  const radius = params.radiusKm ?? 15;
  const event = await prisma.calendarEvent.create({
    data: {
      name: params.name,
      type: params.type,
      town: params.town,
      latitude: params.latitude,
      longitude: params.longitude,
      startDate: new Date(`${params.startDate}T00:00:00`),
      endDate: params.endDate ? new Date(`${params.endDate}T00:00:00`) : null,
      source: "manual",
    },
  });

  const branches = await prisma.branch.findMany({
    where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    select: { id: true, latitude: true, longitude: true },
  });

  let linked = 0;
  for (const b of branches) {
    const dist = haversineKm(
      { lat: params.latitude, lng: params.longitude },
      { lat: b.latitude as number, lng: b.longitude as number },
    );
    if (dist <= radius) {
      // peso decreciente con la distancia (1 en el sitio, 0 en el borde).
      const weight = Math.max(0, 1 - dist / radius);
      await prisma.eventBranchImpact.upsert({
        where: { eventId_branchId: { eventId: event.id, branchId: b.id } },
        create: { eventId: event.id, branchId: b.id, distanceKm: dist, weight },
        update: { distanceKm: dist, weight },
      });
      linked++;
    }
  }

  return { eventId: event.id, linkedBranches: linked };
}
