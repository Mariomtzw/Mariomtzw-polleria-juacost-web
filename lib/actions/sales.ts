"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getActivePriceList, precioPorPieza, type PiecePrices } from "@/lib/pricing";
import { dailySaleSchema } from "@/lib/validation";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Registra (o actualiza) la venta diaria de un puesto.
 * - Protegido por assertOwner().
 * - Si no se envían los 8 precios, toma la PriceList vigente del puesto.
 * - Guarda el SNAPSHOT de los 8 precios + precioPorPieza en el registro.
 * - Idempotente: upsert por (date, branchId).
 */
export async function upsertDailySale(
  formOrInput: FormData | Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  await assertOwner();

  const raw =
    formOrInput instanceof FormData
      ? Object.fromEntries(formOrInput.entries())
      : formOrInput;

  const parsed = dailySaleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  // Resolver los precios: override enviado > PriceList vigente.
  const provided = input.precios ?? {};
  const hasAll8 =
    provided.precioPechuga !== undefined &&
    provided.precioPierna !== undefined &&
    provided.precioAla !== undefined &&
    provided.precioHuacal !== undefined &&
    provided.precioRabadilla !== undefined &&
    provided.precioHigado !== undefined &&
    provided.precioPata !== undefined &&
    provided.precioCabeza !== undefined;

  let precios: PiecePrices;
  if (hasAll8) {
    precios = provided as PiecePrices;
  } else {
    const vigente = await getActivePriceList(input.branchId);
    if (!vigente) {
      return {
        ok: false,
        error: "Este puesto no tiene lista de precios vigente. Crea una antes de capturar.",
      };
    }
    precios = { ...vigente, ...(provided as Partial<PiecePrices>) };
  }

  const ppp = precioPorPieza(precios);

  const sale = await prisma.dailySale.upsert({
    where: { date_branchId: { date: input.date, branchId: input.branchId } },
    create: {
      date: input.date,
      branchId: input.branchId,
      sellerId: input.sellerId,
      pollosAsignados: input.pollosAsignados,
      valorEstimado: input.valorEstimado,
      vendidoReal: input.vendidoReal,
      notes: input.notes,
      ...precios,
      precioPorPieza: ppp,
    },
    update: {
      sellerId: input.sellerId,
      pollosAsignados: input.pollosAsignados,
      valorEstimado: input.valorEstimado,
      vendidoReal: input.vendidoReal,
      notes: input.notes,
      ...precios,
      precioPorPieza: ppp,
    },
    select: { id: true },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/ventas");
  return { ok: true, data: { id: sale.id } };
}

/** Elimina una venta diaria (por id). */
export async function deleteDailySale(id: string): Promise<ActionResult> {
  await assertOwner();
  await prisma.dailySale.delete({ where: { id } });
  revalidatePath("/admin/ventas");
  return { ok: true };
}
