// Protege la firma HMAC que comparten la web y n8n.
import { signPayload, verifySignature } from "@/lib/bot/signature";

const secret = "secreto-de-prueba";
const ts = 1760990000;
const body = JSON.stringify({ externalId: "web:abc", items: [{ code: "PECHUGA", cantidad: 2 }] });

function check(overrides: Partial<Parameters<typeof verifySignature>[0]> = {}) {
  return verifySignature({
    secret,
    signatureHeader: signPayload(secret, ts, body),
    timestampHeader: String(ts),
    body,
    nowSeconds: ts,
    ...overrides,
  });
}

describe("signPayload / verifySignature", () => {
  it("acepta una firma de ida y vuelta", () => {
    expect(signPayload(secret, ts, body)).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(check()).toBe(true);
  });

  it("acepta un cuerpo vacío (GET)", () => {
    expect(check({ body: "", signatureHeader: signPayload(secret, ts, "") })).toBe(true);
  });

  it("rechaza si cambia un carácter del cuerpo, del secreto o del timestamp", () => {
    expect(check({ body: body.replace("abc", "abd") })).toBe(false);
    expect(check({ secret: secret + "x" })).toBe(false);
    expect(check({ timestampHeader: String(ts + 1), nowSeconds: ts })).toBe(false);
  });

  it("acepta exactamente 300 s de diferencia y rechaza 301 s", () => {
    expect(check({ nowSeconds: ts + 300 })).toBe(true);
    expect(check({ nowSeconds: ts - 300 })).toBe(true);
    expect(check({ nowSeconds: ts + 301 })).toBe(false);
    expect(check({ nowSeconds: ts - 301 })).toBe(false);
  });

  it("rechaza encabezados faltantes o mal formados sin lanzar", () => {
    const good = signPayload(secret, ts, body);
    expect(check({ signatureHeader: null })).toBe(false);
    expect(check({ timestampHeader: null })).toBe(false);
    expect(check({ timestampHeader: "abc" })).toBe(false);
    expect(check({ signatureHeader: good.replace("sha256=", "sha1=") })).toBe(false);
    expect(check({ signatureHeader: good.slice(7) })).toBe(false);
    expect(check({ signatureHeader: good + "00" })).toBe(false);
    expect(check({ signatureHeader: "sha256=" })).toBe(false);
  });
});
