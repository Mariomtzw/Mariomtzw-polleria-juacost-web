import { prisma } from "@/lib/prisma";
import { getActivePriceList } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { catalogItems, type CatalogItem } from "@/lib/bot/order";

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
