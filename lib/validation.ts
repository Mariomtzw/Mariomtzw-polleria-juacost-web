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

// ─── Chatbot de ventas ───
export const ORDER_ITEM_CODES = [
  "POLLO_ENTERO", "PECHUGA", "PIERNA", "ALA", "HUACAL", "RABADILLA", "HIGADO", "PATA", "CABEZA",
] as const;
export type OrderItemCode = (typeof ORDER_ITEM_CODES)[number];

export const botOrderSchema = z.object({
  externalId: z.string().min(1).max(100).regex(/^(wa|web):/, "externalId inválido"),
  source: z.enum(["WEB", "WHATSAPP"]),
  customerName: z.string().trim().min(2, "El nombre es muy corto").max(80, "El nombre es muy largo"),
  customerPhone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .pipe(z.string().min(10, "Teléfono inválido").max(15, "Teléfono inválido")),
  items: z
    .array(z.object({ code: z.enum(ORDER_ITEM_CODES), cantidad: z.coerce.number().int().min(1).max(50) }))
    .min(1, "El pedido está vacío")
    .max(10, "Máximo 10 productos por pedido"),
  notes: z.string().max(500).optional(),
});
export type BotOrderInput = z.infer<typeof botOrderSchema>;

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid("Sesión inválida"),
  message: z.string().trim().min(1, "Escribe un mensaje").max(500, "Máximo 500 caracteres"),
});

export const entityIdSchema = z.string().min(1).max(64);
