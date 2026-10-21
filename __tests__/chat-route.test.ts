// Protege el proxy público del widget: valida, firma hacia n8n y nunca deja pasar un fallo crudo.
import { POST } from "@/app/api/chat/route";
import { verifySignature } from "@/lib/bot/signature";

const SECRET = "secreto-de-prueba";
const URL_N8N = "https://n8n.example.test/webhook/pollos-chat";
const SESSION = "00000000-0000-4000-8000-000000000000";
const UNAVAILABLE = "No pude responder ahora. Llámanos o escríbenos por WhatsApp.";

let fetchSpy: jest.SpyInstance;

function chatRequest(payload: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

const n8nAnswers = (status: number, body: unknown) =>
  fetchSpy.mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  process.env.NEXT_PUBLIC_CHAT_ENABLED = "1";
  process.env.N8N_CHAT_WEBHOOK_URL = URL_N8N;
  process.env.BOT_WEBHOOK_SECRET = SECRET;
  fetchSpy = jest.spyOn(global, "fetch").mockImplementation(() => Promise.reject(new Error("sin simular")));
});

afterEach(() => fetchSpy.mockRestore());

describe("POST /api/chat", () => {
  it("responde 503 sin fetch si el chat está apagado", async () => {
    process.env.NEXT_PUBLIC_CHAT_ENABLED = "0";
    const res = await POST(chatRequest({ sessionId: SESSION, message: "Hola" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: "El chat no está disponible" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(["N8N_CHAT_WEBHOOK_URL", "BOT_WEBHOOK_SECRET"])("responde 503 sin fetch si falta %s", async (key) => {
    delete process.env[key];
    expect((await POST(chatRequest({ sessionId: SESSION, message: "Hola" }))).status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("responde 400 sin fetch con un mensaje vacío o un cuerpo que no es JSON", async () => {
    const res = await POST(chatRequest({ sessionId: SESSION, message: "   " }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "Escribe un mensaje" });
    expect((await POST(chatRequest("{no"))).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reenvía a n8n una sola vez, firmado y con sessionId web:", async () => {
    n8nAnswers(200, { reply: "Hola" });
    await POST(chatRequest({ sessionId: SESSION, message: "¿Tienen pollo?" }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(URL_N8N);
    const headers = init.headers as Record<string, string>;
    const sent = JSON.parse(init.body as string);
    expect(sent.sessionId).toBe("web:" + SESSION);
    expect(sent.message).toBe("¿Tienen pollo?");
    expect(
      verifySignature({
        secret: SECRET,
        signatureHeader: headers["x-hub-signature-256"],
        timestampHeader: headers["x-bot-timestamp"],
        body: init.body as string,
        nowSeconds: Math.floor(Date.now() / 1000),
      }),
    ).toBe(true);
  });

  it("devuelve la respuesta de n8n en data.reply", async () => {
    n8nAnswers(200, { reply: "Hola" });
    const res = await POST(chatRequest({ sessionId: SESSION, message: "Hola" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { reply: "Hola" } });
  });

  it("responde 502 si n8n falla con 500", async () => {
    n8nAnswers(500, { error: "x" });
    const res = await POST(chatRequest({ sessionId: SESSION, message: "Hola" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: UNAVAILABLE });
  });

  it("responde 502 si se agota el tiempo", async () => {
    fetchSpy.mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    expect((await POST(chatRequest({ sessionId: SESSION, message: "Hola" }))).status).toBe(502);
  });

  it("responde 502 si n8n contesta sin reply", async () => {
    n8nAnswers(200, {});
    expect((await POST(chatRequest({ sessionId: SESSION, message: "Hola" }))).status).toBe(502);
  });
});
