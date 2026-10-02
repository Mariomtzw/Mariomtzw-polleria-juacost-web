/**
 * Fechas del negocio. El panel trabaja por DÍA ("YYYY-MM-DD") y ese día es el
 * de Banderilla, Veracruz, no el del servidor: Vercel corre en UTC, así que a
 * partir de las 6 de la tarde (hora de México) `new Date().toISOString()` ya
 * devuelve la fecha de mañana. Usa siempre estas funciones para "hoy".
 *
 * Este archivo no importa nada del servidor: sirve igual en componentes de
 * cliente y de servidor.
 */
export const BUSINESS_TZ = "America/Mexico_City";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `true` si el valor es una fecha real con forma "YYYY-MM-DD". */
export function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  // Rechaza fechas imposibles como 2026-02-31 (JS las "corrige" a marzo).
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Fecha de hoy ("YYYY-MM-DD") en la zona horaria del negocio. */
export function todayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Suma (o resta) días a una fecha "YYYY-MM-DD" sin depender de zonas horarias. */
export function shiftISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Para `?date=` de las páginas: usa el parámetro si es válido; si no, hoy. */
export function resolveDateParam(value: string | undefined): string {
  return isISODate(value) ? value : todayISO();
}

/**
 * Medianoche del día de hoy (del negocio) como `Date`, con la misma convención
 * que usa el resto del código al guardar y consultar (`new Date("…T00:00:00")`).
 */
export function businessToday(now: Date = new Date()): Date {
  return new Date(`${todayISO(now)}T00:00:00`);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Los textos se arman a mano (sin Intl) para que el servidor y el navegador
// escriban exactamente lo mismo y no haya diferencias al hidratar.
function parts(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return { dia: DIAS[d.getUTCDay()], n: d.getUTCDate(), mes: MESES[d.getUTCMonth()], anio: d.getUTCFullYear() };
}

/** "jue 1 oct" — fecha corta para tablas. */
export function formatDateShort(date: string): string {
  const { dia, n, mes } = parts(date);
  return `${dia.slice(0, 3)} ${n} ${mes.slice(0, 3)}`;
}

/** "jueves 1 de octubre de 2026" — fecha larga para encabezados. */
export function formatDateLong(date: string): string {
  const { dia, n, mes, anio } = parts(date);
  return `${dia} ${n} de ${mes} de ${anio}`;
}
