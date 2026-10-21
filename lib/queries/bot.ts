import { prisma } from "@/lib/prisma";
import { getActivePriceList } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { catalogItems, folioFor, pickupNoteFor, type CatalogItem, type QuoteLine } from "@/lib/bot/order";

// Catálogo que ve el bot: el puesto de recogida (AppSetting) y su PriceList vigente.

export const BOT_PICKUP_BRANCH_KEY = "bot.pickupBranchId";

export type BotCatalog =
  | { configured: false }
  | {
      configured: true;
      branch: { id: string; name: string };
      address: string;
      hours: string;
      phones: string[];
      items: CatalogItem[];
    };

export async function getBotCatalog(): Promise<BotCatalog> {
  const setting = await prisma.appSetting.findUnique({ where: { key: BOT_PICKUP_BRANCH_KEY } });
  if (!setting) return { configured: false };

  const [branch, prices] = await Promise.all([
    prisma.branch.findFirst({
      where: { id: setting.value, isActive: true },
      select: { id: true, name: true },
    }),
    getActivePriceList(setting.value),
  ]);
  if (!branch || !prices) return { configured: false };

  return {
    configured: true,
    branch,
    address: SITE.address,
    hours: SITE.hours,
    phones: SITE.phones.map((p) => p.label),
    items: catalogItems(prices),
  };
}

export async function getBotPickupBranchId(): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { key: BOT_PICKUP_BRANCH_KEY } });
  return setting?.value ?? null;
}

export interface BotOrderRow {
  id: string;
  folio: string;
  source: "WEB" | "WHATSAPP";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  customerName: string | null;
  customerPhone: string | null;
  lines: QuoteLine[];
  total: number;
  pickupDate: string;
  pickupNote: string;
  notes: string | null;
  createdAt: string;
}

const BOT_SOURCES = { in: ["WEB", "WHATSAPP"] as ("WEB" | "WHATSAPP")[] };
const BOT_ORDER_SELECT = {
  id: true,
  source: true,
  status: true,
  customerName: true,
  customerPhone: true,
  items: true,
  amount: true,
  date: true,
  pickupAt: true,
  notes: true,
  createdAt: true,
} as const;

/** Pendientes del bot (los más viejos primero) + los 20 resueltos más recientes. */
export async function getBotOrders(): Promise<BotOrderRow[]> {
  const [pending, recent] = await Promise.all([
    prisma.order.findMany({
      where: { source: BOT_SOURCES, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: BOT_ORDER_SELECT,
    }),
    prisma.order.findMany({
      where: { source: BOT_SOURCES, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: BOT_ORDER_SELECT,
    }),
  ]);

  return [...pending, ...recent].map((o) => {
    const pickupDate = o.date.toISOString().slice(0, 10);
    return {
      id: o.id,
      folio: folioFor(o.id),
      source: o.source as BotOrderRow["source"],
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      lines: Array.isArray(o.items) ? (o.items as unknown as QuoteLine[]) : [],
      total: o.amount.toNumber(),
      pickupDate,
      pickupNote: o.pickupAt ? pickupNoteFor(pickupDate, o.pickupAt) : "",
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
    };
  });
}
