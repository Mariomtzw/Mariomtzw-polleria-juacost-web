import { z } from "zod";

// Fecha en formato "YYYY-MM-DD" -> Date (nivel día, sin zona horaria sorpresa)
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)")
  .transform((s) => new Date(`${s}T00:00:00`));

const money = z.coerce.number().nonnegative();

// Los 8 precios son OPCIONALES: si no vienen, se toman de la PriceList vigente.
export const piecePricesSchema = z
  .object({
    precioPechuga: money,
    precioPierna: money,
    precioAla: money,
    precioHuacal: money,
    precioRabadilla: money,
    precioHigado: money,
    precioPata: money,
    precioCabeza: money,
  })
  .partial();

export const dailySaleSchema = z.object({
  date: dateString,
  branchId: z.string().min(1),
  sellerId: z.string().min(1), // se confirma en la captura (rotación)
  pollosAsignados: z.coerce.number().positive(),
  valorEstimado: money,
  vendidoReal: money,
  notes: z.string().max(500).optional(),
  precios: piecePricesSchema.optional(),
});
export type DailySaleInput = z.infer<typeof dailySaleSchema>;

export const leftoverSchema = z.object({
  date: dateString,
  branchId: z.string().min(1),
  pieceTypeId: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unitPrice: money.optional(),
});
export type LeftoverInput = z.infer<typeof leftoverSchema>;

export const orderSchema = z.object({
  date: dateString,
  branchId: z.string().min(1),
  amount: money,
  quantity: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});
export type OrderInput = z.infer<typeof orderSchema>;
