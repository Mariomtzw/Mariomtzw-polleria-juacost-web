// Protege las rutas firmadas que llama n8n: orden 500 → 401 → 503 → 200.
const appSettingFindUnique = jest.fn();
const branchFindFirst = jest.fn();
const priceListFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: { findUnique: (...a: unknown[]) => appSettingFindUnique(...a) },
    branch: { findFirst: (...a: unknown[]) => branchFindFirst(...a) },
    priceList: { findFirst: (...a: unknown[]) => priceListFindFirst(...a) },
  },
}));

import { GET } from "@/app/api/bot/catalogo/route";
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
