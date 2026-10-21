// Protege las rutas firmadas que llama n8n: orden 500 → 401 → 503 → 200.
const appSettingFindUnique = jest.fn();
const branchFindFirst = jest.fn();
const priceListFindFirst = jest.fn();
const orderUpsert = jest.fn();
const orderFindUnique = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: { findUnique: (...a: unknown[]) => appSettingFindUnique(...a) },
    branch: { findFirst: (...a: unknown[]) => branchFindFirst(...a) },
    priceList: { findFirst: (...a: unknown[]) => priceListFindFirst(...a) },
    order: {
      upsert: (...a: unknown[]) => orderUpsert(...a),
      findUnique: (...a: unknown[]) => orderFindUnique(...a),
    },
  },
}));

import { GET } from "@/app/api/bot/catalogo/route";
import { POST } from "@/app/api/bot/pedidos/route";
import { signPayload } from "@/lib/bot/signature";

const SECRET = "secreto-de-prueba";
const dec = (n: number) => ({ toNumber: () => n });

function catalogRequest(opts: { secret?: string; ageSeconds?: number; signature?: string | null } = {}) {
  const ts = Math.floor(Date.now() / 1000) - (opts.ageSeconds ?? 0);
  const headers: Record<string, string> = { "X-Bot-Timestamp": String(ts) };
  const signature = opts.signature === undefined ? signPayload(opts.secret ?? SECRET, ts, "") : opts.signature;
  if (signature !== null) headers["X-Hub-Signature-256"] = signature;
  return new Request("http://localhost/api/bot/catalogo", { headers });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BOT_WEBHOOK_SECRET = SECRET;
  appSettingFindUnique.mockResolvedValue({ key: "bot.pickupBranchId", value: "b1" });
  branchFindFirst.mockResolvedValue({ id: "b1", name: "S.M. Manuela" });
  priceListFindFirst.mockResolvedValue({
    precioPechuga: dec(45),
    precioPierna: dec(10),
    precioAla: dec(4),
    precioHuacal: dec(2.5),
    precioRabadilla: dec(2),
    precioHigado: dec(1.5),
    precioPata: dec(0.5),
    precioCabeza: dec(0.5),
  });
});

describe("GET /api/bot/catalogo", () => {
  it("responde 500 sin BOT_WEBHOOK_SECRET", async () => {
    delete process.env.BOT_WEBHOOK_SECRET;
    const res = await GET(catalogRequest());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "BOT_WEBHOOK_SECRET no configurado" });
  });

  it.each([
    ["sin firma", { signature: null }],
    ["con firma de otro secreto", { secret: "otro" }],
    ["con timestamp de hace 301 s", { ageSeconds: 301 }],
  ])("responde 401 %s y no consulta la base", async (_name, opts) => {
    const res = await GET(catalogRequest(opts));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "No autorizado" });
    expect(appSettingFindUnique).not.toHaveBeenCalled();
  });

  it("responde 503 si no hay puesto de recogida configurado", async () => {
    appSettingFindUnique.mockResolvedValue(null);
    const res = await GET(catalogRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: "Puesto de recogida no configurado" });
  });

  it("responde 503 si el puesto está inactivo o sin lista de precios", async () => {
    branchFindFirst.mockResolvedValueOnce(null);
    expect((await GET(catalogRequest())).status).toBe(503);
    priceListFindFirst.mockResolvedValueOnce(null);
    expect((await GET(catalogRequest())).status).toBe(503);
  });

  it("responde 200 con 9 productos, el pollo entero en 80.5 y la recogida", async () => {
    const res = await GET(catalogRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.branch).toEqual({ id: "b1", name: "S.M. Manuela" });
    expect(body.data.items).toHaveLength(9);
    expect(body.data.items[0]).toEqual({ code: "POLLO_ENTERO", label: "Pollo entero", precio: 80.5 });
    expect(body.data.phones).toEqual(["2282 10 53 30", "2283 57 60 92"]);
    expect(body.data.pickup.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(body.data.pickup.pickupAt).toISOString()).toBe(body.data.pickup.pickupAt);
    expect(body.data.pickup.note).toMatch(/^Recógelo en Hidalgo #73/);
    expect(branchFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b1", isActive: true } }),
    );
  });
});

describe("POST /api/bot/pedidos", () => {
  const order = {
    externalId: "wa:wamid.ABC123",
    source: "WHATSAPP",
    customerName: "Ana López",
    customerPhone: "228-123-4567",
    items: [
      { code: "POLLO_ENTERO", cantidad: 2 },
      { code: "PECHUGA", cantidad: 3 },
    ],
    total: 1,
  };
  const savedRow = {
    id: "cm1abcxyz9k2",
    amount: dec(296),
    date: new Date("2026-10-20T00:00:00Z"),
    items: [{ code: "POLLO_ENTERO", label: "Pollo entero", cantidad: 2, precioUnitario: 80.5, subtotal: 161 }],
    pickupAt: new Date("2026-10-20T16:30:00Z"),
  };

  function orderRequest(body: string, secret = SECRET) {
    const ts = Math.floor(Date.now() / 1000);
    return new Request("http://localhost/api/bot/pedidos", {
      method: "POST",
      body,
      headers: { "X-Bot-Timestamp": String(ts), "X-Hub-Signature-256": signPayload(secret, ts, body) },
    });
  }

  beforeEach(() => {
    orderUpsert.mockResolvedValue(savedRow);
  });

  it("responde 500 sin BOT_WEBHOOK_SECRET", async () => {
    delete process.env.BOT_WEBHOOK_SECRET;
    expect((await POST(orderRequest(JSON.stringify(order)))).status).toBe(500);
  });

  it("responde 401 con firma inválida y no toca prisma.order", async () => {
    const res = await POST(orderRequest(JSON.stringify(order), "otro"));
    expect(res.status).toBe(401);
    expect(orderUpsert).not.toHaveBeenCalled();
    expect(orderFindUnique).not.toHaveBeenCalled();
    expect(appSettingFindUnique).not.toHaveBeenCalled();
  });

  it("responde 400 si el cuerpo firmado no es JSON", async () => {
    const res = await POST(orderRequest("{no es json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "JSON inválido" });
  });

  it("responde 400 con el primer mensaje de validación", async () => {
    const res = await POST(orderRequest(JSON.stringify({ ...order, items: [] })));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "El pedido está vacío" });
    expect(orderUpsert).not.toHaveBeenCalled();
  });

  it("responde 503 sin puesto configurado y no llama upsert", async () => {
    appSettingFindUnique.mockResolvedValue(null);
    const res = await POST(orderRequest(JSON.stringify(order)));
    expect(res.status).toBe(503);
    expect(orderUpsert).not.toHaveBeenCalled();
  });

  it("ignora el total del payload: upsert por externalId, update vacío, PENDING y 296", async () => {
    const res = await POST(orderRequest(JSON.stringify(order)));
    expect(res.status).toBe(200);
    expect(orderUpsert).toHaveBeenCalledTimes(1);
    const args = orderUpsert.mock.calls[0][0];
    expect(args.where).toEqual({ externalId: "wa:wamid.ABC123" });
    expect(args.update).toEqual({});
    expect(args.create).toMatchObject({
      externalId: "wa:wamid.ABC123",
      source: "WHATSAPP",
      status: "PENDING",
      branchId: "b1",
      amount: 296,
      quantity: 2,
      customerPhone: "2281234567",
    });
    expect(args.create.items).toHaveLength(2);
  });

  it("responde 200 desde la fila guardada con el folio de 6 caracteres", async () => {
    const body = await (await POST(orderRequest(JSON.stringify(order)))).json();
    expect(body).toEqual({
      ok: true,
      data: {
        id: "cm1abcxyz9k2",
        folio: "XYZ9K2",
        total: 296,
        pickupDate: "2026-10-20",
        pickupNote: "Recógelo en Hidalgo #73, Banderilla Centro desde las 10:30 del martes 20 de octubre de 2026.",
        lines: savedRow.items,
      },
    });
  });

  it("si upsert choca con P2002 lee el pedido por externalId y responde 200", async () => {
    orderUpsert.mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }));
    orderFindUnique.mockResolvedValue(savedRow);
    const res = await POST(orderRequest(JSON.stringify(order)));
    expect(res.status).toBe(200);
    expect(orderFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { externalId: "wa:wamid.ABC123" } }));
    expect((await res.json()).data.folio).toBe("XYZ9K2");
  });
});
