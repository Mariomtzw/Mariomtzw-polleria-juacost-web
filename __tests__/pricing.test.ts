// Protege la fórmula del precio por pieza (pierna/ala/pata cuentan x2).
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import { precioPorPieza } from "@/lib/pricing";

describe("precioPorPieza (fórmula de despiece)", () => {
  it("coincide con el Excel para S.M. Manuela = 80.5", () => {
    const p = precioPorPieza({
      precioPechuga: 45,
      precioPierna: 10,
      precioAla: 4,
      precioHuacal: 2.5,
      precioRabadilla: 2,
      precioHigado: 1.5,
      precioPata: 0.5,
      precioCabeza: 0.5,
    });
    expect(p).toBe(80.5); // 45 + 2*10 + 2*4 + 2.5 + 2 + 1.5 + 2*0.5 + 0.5
  });

  it("coincide con el Excel para Local Laura = 87.5", () => {
    const p = precioPorPieza({
      precioPechuga: 50,
      precioPierna: 10,
      precioAla: 4.5,
      precioHuacal: 3,
      precioRabadilla: 2.5,
      precioHigado: 1.5,
      precioPata: 0.5,
      precioCabeza: 0.5,
    });
    expect(p).toBe(87.5);
  });
});
