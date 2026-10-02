"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { precioPorPieza } from "@/lib/pricing";

const money = z.coerce.number().nonnegative();
const schema = z.object({
  branchId: z.string().min(1),
  precioPechuga: money, precioPierna: money, precioAla: money, precioHuacal: money,
  precioRabadilla: money, precioHigado: money, precioPata: money, precioCabeza: money,
});

type R<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/** Crea una NUEVA versión de la lista de precios (fresco) de un puesto. */
export async function setFreshPrices(input: unknown): Promise<R<{ precioPorPieza: number }>> {
  await assertOwner();
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const { branchId, ...prices } = p.data;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ppp = precioPorPieza(prices);
  await prisma.$transaction(async (tx) => {
    await tx.priceList.updateMany({ where: { branchId, isActive: true }, data: { isActive: false } });
    await tx.priceList.create({ data: { branchId, effectiveFrom: today, isActive: true, ...prices, precioPorPieza: ppp } });
  });
  revalidatePath("/admin/precios");
  revalidatePath("/admin/captura");
  return { ok: true, data: { precioPorPieza: ppp } };
}
