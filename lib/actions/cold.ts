"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { businessToday } from "@/lib/dates";

type R<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
const money = z.coerce.number().nonnegative();

// 1) Precios fríos por puesto (versionado: desactiva vigente, crea nuevo)
const pricesSchema = z.object({
  branchId: z.string().min(1),
  prices: z.array(z.object({ pieceTypeId: z.string().min(1), price: money })).min(1),
});
export async function setColdPrices(input: unknown): Promise<R> {
  await assertOwner();
  const p = pricesSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const today = businessToday(); // fecha de vigencia = día del negocio
  await prisma.$transaction(async (tx) => {
    for (const row of p.data.prices) {
      await tx.coldPiecePrice.updateMany({
        where: { branchId: p.data.branchId, pieceTypeId: row.pieceTypeId, isActive: true },
        data: { isActive: false },
      });
      await tx.coldPiecePrice.create({
        data: { branchId: p.data.branchId, pieceTypeId: row.pieceTypeId, price: row.price, effectiveFrom: today, isActive: true },
      });
    }
  });
  revalidatePath("/admin/frio");
  return { ok: true };
}

// 2) Distribuir frío (crea/suma ColdStock; snapshot del precio frío vigente)
const distSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(z.object({
    branchId: z.string().min(1), pieceTypeId: z.string().min(1), quantity: z.coerce.number().positive(),
  })).min(1),
});
export async function distributeCold(input: unknown): Promise<R<{ count: number }>> {
  await assertOwner();
  const p = distSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const date = new Date(`${p.data.date}T00:00:00`);
  const origin = new Date(date); origin.setDate(origin.getDate() - 1);

  let count = 0;
  for (const r of p.data.rows) {
    const priceRow = await prisma.coldPiecePrice.findFirst({
      where: { branchId: r.branchId, pieceTypeId: r.pieceTypeId, isActive: true },
      orderBy: { effectiveFrom: "desc" },
    });
    const unitPrice = priceRow ? priceRow.price.toNumber() : 0;
    const existing = await prisma.coldStock.findUnique({
      where: { date_branchId_pieceTypeId: { date, branchId: r.branchId, pieceTypeId: r.pieceTypeId } },
    });
    if (existing) {
      await prisma.coldStock.update({
        where: { id: existing.id },
        data: { quantityReceived: existing.quantityReceived.toNumber() + r.quantity },
      });
    } else {
      await prisma.coldStock.create({
        data: { date, branchId: r.branchId, pieceTypeId: r.pieceTypeId, quantityReceived: r.quantity, unitPrice, originDate: origin },
      });
    }
    count++;
  }
  revalidatePath("/admin/frio");
  return { ok: true, data: { count } };
}

// 3) Guardar inventario/venta de frío (precio editable + vendido)
const invSchema = z.object({
  rows: z.array(z.object({ id: z.string().min(1), unitPrice: money, quantitySold: z.coerce.number().nonnegative() })),
});
export async function saveColdInventory(input: unknown): Promise<R<{ saved: number }>> {
  await assertOwner();
  const p = invSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  for (const r of p.data.rows) {
    await prisma.coldStock.update({ where: { id: r.id }, data: { unitPrice: r.unitPrice, quantitySold: r.quantitySold } });
  }
  revalidatePath("/admin/frio");
  return { ok: true, data: { saved: p.data.rows.length } };
}

export async function deleteColdStock(id: string): Promise<R> {
  await assertOwner();
  await prisma.coldStock.delete({ where: { id } });
  revalidatePath("/admin/frio");
  return { ok: true };
}
