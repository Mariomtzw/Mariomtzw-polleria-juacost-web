// Protege la cotización, la hora de recogida y la validación de los pedidos del bot.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import { catalogItems, quoteOrder, resolvePickup, folioFor, type CatalogItem } from "@/lib/bot/order";
import { botOrderSchema, chatMessageSchema } from "@/lib/validation";

const manuela = {
  precioPechuga: 45,
  precioPierna: 10,
  precioAla: 4,
  precioHuacal: 2.5,
  precioRabadilla: 2,
  precioHigado: 1.5,
  precioPata: 0.5,
  precioCabeza: 0.5,
};

describe("catalogItems", () => {
  it("devuelve los 9 productos y el pollo entero sale de precioPorPieza = 80.5", () => {
    const items = catalogItems(manuela);
    expect(items.map((i) => i.code)).toEqual([
      "POLLO_ENTERO", "PECHUGA", "PIERNA", "ALA", "HUACAL", "RABADILLA", "HIGADO", "PATA", "CABEZA",
    ]);
    expect(items[0]).toEqual({ code: "POLLO_ENTERO", label: "Pollo entero", precio: 80.5 });
    expect(items.find((i) => i.code === "HIGADO")?.label).toBe("Hígado");
  });
});

describe("quoteOrder", () => {
  it("2 pollos enteros + 3 pechugas = 296 (161 + 135)", () => {
    const q = quoteOrder(
      [{ code: "POLLO_ENTERO", cantidad: 2 }, { code: "PECHUGA", cantidad: 3 }],
      catalogItems(manuela),
    );
    expect(q.lines).toHaveLength(2);
    expect(q.lines.map((l) => l.subtotal)).toEqual([161, 135]);
    expect(q.total).toBe(296);
  });

  it("redondea a 2 decimales (3 × 0.1 = 0.3)", () => {
    const catalog: CatalogItem[] = [{ code: "ALA", label: "Ala", precio: 0.1 }];
    const q = quoteOrder([{ code: "ALA", cantidad: 3 }], catalog);
    expect(q.lines[0].subtotal).toBe(0.3);
    expect(q.total).toBe(0.3);
  });

  it("lanza con un producto que no está en el catálogo", () => {
    expect(() => quoteOrder([{ code: "PATA", cantidad: 1 }], [])).toThrow("Producto desconocido: PATA");
  });
});

describe("resolvePickup (hora de México = UTC−6)", () => {
  it.each([
    ["2026-10-20T16:00:00Z", "2026-10-20", "2026-10-20T16:30:00.000Z"], // 10:00
    ["2026-10-20T20:29:00Z", "2026-10-20", "2026-10-20T20:59:00.000Z"], // 14:29
    ["2026-10-20T20:30:00Z", "2026-10-21", "2026-10-21T13:00:00.000Z"], // 14:30 → mañana
    ["2026-10-20T11:00:00Z", "2026-10-20", "2026-10-20T13:00:00.000Z"], // 05:00 → abre 07:00
    ["2026-10-21T05:30:00Z", "2026-10-21", "2026-10-21T13:00:00.000Z"], // 23:30 del 20
  ])("%s → %s desde %s", (now, date, pickupAt) => {
    const r = resolvePickup(new Date(now));
    expect(r.date).toBe(date);
    expect(r.pickupAt.toISOString()).toBe(pickupAt);
  });

  it("arma la nota con la dirección y la hora local", () => {
    const r = resolvePickup(new Date("2026-10-20T20:30:00Z"));
    expect(r.note).toBe("Recógelo en Hidalgo #73, Banderilla Centro desde las 07:00 del miércoles 21 de octubre de 2026.");
  });
});

describe("folioFor", () => {
  it("toma los últimos 6 caracteres en mayúsculas", () => {
    expect(folioFor("cm1abcxyz9k2")).toBe("XYZ9K2");
  });
});

describe("botOrderSchema", () => {
  const valid = {
    externalId: "wa:wamid.1",
    source: "WHATSAPP",
    customerName: "Ana López",
    customerPhone: "228-123-4567",
    items: [{ code: "POLLO_ENTERO", cantidad: 2 }],
    total: 1,
  };

  it("elimina el total enviado y normaliza el teléfono", () => {
    const r = botOrderSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect("total" in r.data).toBe(false);
      expect(r.data.customerPhone).toBe("2281234567");
    }
  });

  it("rechaza items vacíos, externalId ajeno y cantidad 51", () => {
    expect(botOrderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(botOrderSchema.safeParse({ ...valid, externalId: "x:1" }).success).toBe(false);
    expect(botOrderSchema.safeParse({ ...valid, items: [{ code: "PECHUGA", cantidad: 51 }] }).success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  const sessionId = "00000000-0000-4000-8000-000000000000";
  it("rechaza mensajes vacíos y de más de 500 caracteres", () => {
    expect(chatMessageSchema.safeParse({ sessionId, message: "   " }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ sessionId, message: "a".repeat(501) }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ sessionId, message: "¿Tienen pollo?" }).success).toBe(true);
  });
});
