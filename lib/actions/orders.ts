"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validation";
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
