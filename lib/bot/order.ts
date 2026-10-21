import { precioPorPieza, type PiecePrices } from "@/lib/pricing";
import { ORDER_ITEM_CODES, type OrderItemCode } from "@/lib/validation";
import { BUSINESS_TZ, todayISO, shiftISO, formatDateLong } from "@/lib/dates";
import { SITE } from "@/lib/site";

// Catálogo, cotización y recogida de los pedidos del bot. Funciones puras:
// el total SIEMPRE lo calcula el servidor con estos precios.

export interface CatalogItem {
  code: OrderItemCode;
  label: string;
  precio: number;
}

export interface QuoteLine {
  code: OrderItemCode;
  label: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

const ITEMS: Record<OrderItemCode, { label: string; price: (p: PiecePrices) => number }> = {
  POLLO_ENTERO: { label: "Pollo entero", price: (p) => precioPorPieza(p) },
  PECHUGA: { label: "Pechuga", price: (p) => p.precioPechuga },
  PIERNA: { label: "Pierna", price: (p) => p.precioPierna },
  ALA: { label: "Ala", price: (p) => p.precioAla },
  HUACAL: { label: "Huacal", price: (p) => p.precioHuacal },
  RABADILLA: { label: "Rabadilla", price: (p) => p.precioRabadilla },
  HIGADO: { label: "Hígado", price: (p) => p.precioHigado },
  PATA: { label: "Pata", price: (p) => p.precioPata },
  CABEZA: { label: "Cabeza", price: (p) => p.precioCabeza },
};

const OPEN_MIN = 7 * 60; // 07:00
const CUTOFF_MIN = 14 * 60 + 30; // 14:30: después, el pedido es para el día siguiente
const PREP_MIN = 30;

const round2 = (x: number) => Math.round(x * 100) / 100;
const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Los 9 productos del bot con precio, en el orden de ORDER_ITEM_CODES. */
export function catalogItems(prices: PiecePrices): CatalogItem[] {
  return ORDER_ITEM_CODES.map((code) => ({
    code,
    label: ITEMS[code].label,
    precio: round2(ITEMS[code].price(prices)),
  }));
}

/** Cotiza con los precios del catálogo del servidor. Lanza si un código no existe. */
export function quoteOrder(
  items: { code: OrderItemCode; cantidad: number }[],
  catalog: CatalogItem[],
): { lines: QuoteLine[]; total: number } {
  const lines = items.map(({ code, cantidad }) => {
    const item = catalog.find((c) => c.code === code);
    if (!item) throw new Error(`Producto desconocido: ${code}`);
    return {
      code,
      label: item.label,
      cantidad,
      precioUnitario: item.precio,
      subtotal: round2(item.precio * cantidad),
    };
  });
  return { lines, total: round2(lines.reduce((sum, l) => sum + l.subtotal, 0)) };
}

/** Minutos desde la medianoche en la hora del negocio. */
export function businessMinutes(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** Día y hora desde la que se puede recoger un pedido hecho en `now`. */
export function resolvePickup(now: Date): { date: string; pickupAt: Date; note: string } {
  const minutes = businessMinutes(now);
  const sameDay = minutes < CUTOFF_MIN;
  const date = sameDay ? todayISO(now) : shiftISO(todayISO(now), 1);
  const pickupMin = sameDay ? Math.max(OPEN_MIN, minutes + PREP_MIN) : OPEN_MIN;
  // shortcut: México no tiene horario de verano desde 2022 (UTC−6 fijo); si vuelve, calcula el desfase con Intl.
  const pickupAt = new Date(`${date}T${hhmm(pickupMin)}:00-06:00`);
  return { date, pickupAt, note: pickupNoteFor(date, pickupAt) };
}

export function pickupNoteFor(date: string, pickupAt: Date): string {
  return `Recógelo en ${SITE.address} desde las ${hhmm(businessMinutes(pickupAt))} del ${formatDateLong(date)}.`;
}

export function folioFor(id: string): string {
  return id.slice(-6).toUpperCase();
}
