"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { leftoverSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/sales";

/**
 * Registra el sobrante (merma) de una pieza en un puesto/día.
 * Protegido por assertOwner().
 */
export async function createLeftover(
  formOrInput: FormData | Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  await assertOwner();

  const raw =
    formOrInput instanceof FormData
      ? Object.fromEntries(formOrInput.entries())
      : formOrInput;

  const parsed = leftoverSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  const leftover = await prisma.leftover.create({
    data: {
      date: input.date,
      branchId: input.branchId,
      pieceTypeId: input.pieceTypeId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
    },
    select: { id: true },
  });

  revalidatePath("/admin/sobrantes");
  return { ok: true, data: { id: leftover.id } };
}

export async function deleteLeftover(id: string): Promise<ActionResult> {
  await assertOwner();
  await prisma.leftover.delete({ where: { id } });
  revalidatePath("/admin/sobrantes");
  return { ok: true };
}
