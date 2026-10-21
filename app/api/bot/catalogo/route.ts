import { verifySignature, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/bot/signature";
import { resolvePickup } from "@/lib/bot/order";
import { getBotCatalog } from "@/lib/queries/bot";

// Sin sesión (como el cron): la llama n8n; su prueba de identidad es la firma HMAC.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.BOT_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "BOT_WEBHOOK_SECRET no configurado" }, { status: 500 });
  }

  const valid = verifySignature({
    secret,
    signatureHeader: request.headers.get(SIGNATURE_HEADER),
    timestampHeader: request.headers.get(TIMESTAMP_HEADER),
    body: await request.text(),
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!valid) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const catalog = await getBotCatalog();
  if (!catalog.configured) {
    return Response.json({ ok: false, error: "Puesto de recogida no configurado" }, { status: 503 });
  }

  const { date, pickupAt, note } = resolvePickup(new Date());
  const { branch, address, hours, phones, items } = catalog;
  return Response.json({
    ok: true,
    data: { branch, address, hours, phones, items, pickup: { date, pickupAt: pickupAt.toISOString(), note } },
  });
}
