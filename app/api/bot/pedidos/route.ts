import { prisma } from "@/lib/prisma";
import { verifySignature, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/bot/signature";
import { quoteOrder, resolvePickup, pickupNoteFor, folioFor, type QuoteLine } from "@/lib/bot/order";
import { getBotCatalog } from "@/lib/queries/bot";
import { botOrderSchema } from "@/lib/validation";

// Sin sesión (como el cron): la llama n8n; su prueba de identidad es la firma HMAC.
// Idempotente por externalId: un reintento devuelve el mismo pedido.
export const dynamic = "force-dynamic";

const ORDER_SELECT = { id: true, amount: true, date: true, items: true, pickupAt: true } as const;

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.BOT_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "BOT_WEBHOOK_SECRET no configurado" }, { status: 500 });
  }

  // Los bytes exactos que firmó n8n: se verifica antes de parsear.
  const raw = await request.text();
  const valid = verifySignature({
    secret,
    signatureHeader: request.headers.get(SIGNATURE_HEADER),
    timestampHeader: request.headers.get(TIMESTAMP_HEADER),
    body: raw,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!valid) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const parsed = botOrderSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { externalId, source, customerName, customerPhone, items, notes } = parsed.data;

  const catalog = await getBotCatalog();
  if (!catalog.configured) {
    return Response.json({ ok: false, error: "Puesto de recogida no configurado" }, { status: 503 });
  }

  const quote = quoteOrder(items, catalog.items);
  const pickup = resolvePickup(new Date());
  const pollos = items.filter((i) => i.code === "POLLO_ENTERO").reduce((sum, i) => sum + i.cantidad, 0);

  let order;
  try {
    order = await prisma.order.upsert({
      where: { externalId },
      create: {
        externalId,
        source,
        status: "PENDING",
        branchId: catalog.branch.id,
        amount: quote.total,
        items: quote.lines as unknown as object[],
        date: new Date(`${pickup.date}T00:00:00`),
        pickupAt: pickup.pickupAt,
        customerName,
        customerPhone,
        notes,
        quantity: pollos || undefined,
      },
      update: {},
      select: ORDER_SELECT,
    });
  } catch (err) {
    // Dos reintentos simultáneos: el segundo choca con el índice único y lee el que ganó.
    if ((err as { code?: unknown }).code !== "P2002") throw err;
    order = await prisma.order.findUnique({ where: { externalId }, select: ORDER_SELECT });
    if (!order) throw err;
  }

  const pickupDate = order.date.toISOString().slice(0, 10);
  return Response.json({
    ok: true,
    data: {
      id: order.id,
      folio: folioFor(order.id),
      total: order.amount.toNumber(),
      pickupDate,
      pickupNote: order.pickupAt ? pickupNoteFor(pickupDate, order.pickupAt) : null,
      lines: order.items as unknown as QuoteLine[],
    },
  });
}
