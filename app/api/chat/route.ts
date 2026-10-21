import { z } from "zod";
import { signPayload, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/bot/signature";
import { chatMessageSchema } from "@/lib/validation";

// Pública (la usa el widget): valida con zod y reenvía firmada a n8n, donde vive el bot.
// Nunca registres el mensaje ni la respuesta.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const n8nReplySchema = z.object({ reply: z.string().min(1).max(2000) });
const UNAVAILABLE = "No pude responder ahora. Llámanos o escríbenos por WhatsApp.";

export async function POST(request: Request): Promise<Response> {
  const url = process.env.N8N_CHAT_WEBHOOK_URL;
  const secret = process.env.BOT_WEBHOOK_SECRET;
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED !== "1" || !url || !secret) {
    return Response.json({ ok: false, error: "El chat no está disponible" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Mensaje inválido" }, { status: 400 });
  }
  const parsed = chatMessageSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { sessionId, message } = parsed.data;
  const body = JSON.stringify({ sessionId: "web:" + sessionId, messageId: crypto.randomUUID(), message });
  const ts = Math.floor(Date.now() / 1000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [SIGNATURE_HEADER]: signPayload(secret, ts, body),
        [TIMESTAMP_HEADER]: String(ts),
      },
      body,
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error("n8n respondió " + res.status);
    const reply = n8nReplySchema.safeParse(await res.json());
    if (!reply.success) throw new Error("respuesta de n8n inválida");
    return Response.json({ ok: true, data: { reply: reply.data.reply } });
  } catch {
    return Response.json({ ok: false, error: UNAVAILABLE }, { status: 502 });
  }
}
