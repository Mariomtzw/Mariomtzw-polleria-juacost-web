"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { orderSchema, entityIdSchema } from "@/lib/validation";
import { BOT_PICKUP_BRANCH_KEY } from "@/lib/queries/bot";
import type { ActionResult } from "@/lib/actions/sales";

/**
 * Registra un pedido de un puesto/día.
 * Protegido por assertOwner().
 */
export async function createOrder(
  formOrInput: FormData | Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  await assertOwner();

  const raw =
    formOrInput instanceof FormData
      ? Object.fromEntries(formOrInput.entries())
      : formOrInput;

  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  const order = await prisma.order.create({
    data: {
      date: input.date,
      branchId: input.branchId,
      amount: input.amount,
      quantity: input.quantity,
      notes: input.notes,
    },
    select: { id: true },
  });

  revalidatePath("/admin/pedidos");
  return { ok: true, data: { id: order.id } };
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  await assertOwner();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

/** Pedido del bot: PENDING → CONFIRMED. El estado va en el where para que dos clics no choquen. */
export async function confirmOrder(id: string): Promise<ActionResult> {
  await assertOwner();
  if (!entityIdSchema.safeParse(id).success) return { ok: false, error: "Pedido inválido" };

  const { count } = await prisma.order.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });
  if (count === 0) return { ok: false, error: "El pedido ya no está pendiente" };

  revalidatePath("/admin/pedidos");
  return { ok: true };
}

/** Solo los pedidos del bot (WEB/WHATSAPP) se cancelan; los del panel se borran. */
export async function cancelOrder(id: string): Promise<ActionResult> {
  await assertOwner();
  if (!entityIdSchema.safeParse(id).success) return { ok: false, error: "Pedido inválido" };

  const { count } = await prisma.order.updateMany({
    where: { id, source: { in: ["WEB", "WHATSAPP"] }, status: { in: ["PENDING", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });
  if (count === 0) return { ok: false, error: "El pedido no se puede cancelar" };

  revalidatePath("/admin/pedidos");
  return { ok: true };
}

/** Puesto donde se recogen los pedidos del bot (sus precios son los del catálogo). */
export async function setBotPickupBranch(branchId: string): Promise<ActionResult> {
  await assertOwner();
  if (!entityIdSchema.safeParse(branchId).success) return { ok: false, error: "Puesto inválido" };

  const branch = await prisma.branch.findFirst({ where: { id: branchId, isActive: true }, select: { id: true } });
  if (!branch) return { ok: false, error: "Puesto no encontrado o inactivo" };

  await prisma.appSetting.upsert({
    where: { key: BOT_PICKUP_BRANCH_KEY },
    create: { key: BOT_PICKUP_BRANCH_KEY, value: branchId },
    update: { value: branchId },
  });

  revalidatePath("/admin/pedidos");
  return { ok: true };
}
