"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getActivePriceList, precioPorPieza } from "@/lib/pricing";

const rowSchema = z.object({
  branchId: z.string().min(1),
  sellerId: z.string().min(1, "Falta la vendedora"),
  pollosAsignados: z.coerce.number().positive(),
  valorEstimado: z.coerce.number().nonnegative(),
  vendidoReal: z.coerce.number().nonnegative(),
});

const payloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(rowSchema),
});

export type SaveResult = { ok: true; saved: number } | { ok: false; error: string };

/** Guarda TODAS las filas capturadas de un día en una sola operación (upsert por
 * puesto/día). Cada venta guarda el snapshot de los 8 precios vigentes. */
export async function saveDayCapture(payload: unknown): Promise<SaveResult> {
  await assertOwner();
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const date = new Date(`${parsed.data.date}T00:00:00`);
  let saved = 0;

  for (const r of parsed.data.rows) {
    const prices = await getActivePriceList(r.branchId);
    if (!prices) continue; // puesto sin lista de precios vigente
    const ppp = precioPorPieza(prices);
    await prisma.dailySale.upsert({
      where: { date_branchId: { date, branchId: r.branchId } },
      create: {
        date, branchId: r.branchId, sellerId: r.sellerId,
        pollosAsignados: r.pollosAsignados, valorEstimado: r.valorEstimado, vendidoReal: r.vendidoReal,
        ...prices, precioPorPieza: ppp,
      },
      update: {
        sellerId: r.sellerId,
        pollosAsignados: r.pollosAsignados, valorEstimado: r.valorEstimado, vendidoReal: r.vendidoReal,
        ...prices, precioPorPieza: ppp,
      },
    });
    saved++;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/captura");
  revalidatePath("/admin/ventas");
  return { ok: true, saved };
}
