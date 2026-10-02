// Protege las fórmulas del semáforo y de equivalentes/diferencia.
// Mockeamos Prisma para que el módulo cargue sin base de datos.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  tierFor,
  equivalentesVendidos,
  diferenciaPollos,
} from "@/lib/calculations";

describe("Semáforo de rendimiento (tierFor)", () => {
  it("clasifica según los umbrales por defecto (1 y 5)", () => {
    expect(tierFor(0.5)).toBe("GREEN"); // diferencia < 1
    expect(tierFor(3)).toBe("YELLOW"); // 1 <= dif < 5
    expect(tierFor(9)).toBe("RED"); // dif >= 5
  });

  it("una vendedora que vende MÁS de lo esperado (dif negativa) es verde", () => {
    expect(tierFor(-4.73)).toBe("GREEN"); // caso real: Marilú
  });

  it("respeta umbrales personalizados", () => {
    expect(tierFor(2, { greenMax: 3, yellowMax: 10 })).toBe("GREEN");
    expect(tierFor(2, { greenMax: 1, yellowMax: 1.5 })).toBe("RED");
  });
});

describe("Equivalentes y diferencia (fórmula del Excel)", () => {
  it("equivalentes = vendidoReal / precioPorPieza", () => {
    // Caso real 2026-04-20, S.M. Manuela: 2863 / 80.5
    const eq = equivalentesVendidos(2863, 80.5);
    expect(eq).toBeCloseTo(35.57, 1);
  });

  it("diferencia = pollosAsignados - equivalentes", () => {
    const eq = equivalentesVendidos(2863, 80.5);
    expect(diferenciaPollos(40, eq)).toBeCloseTo(4.43, 1);
  });

  it("evita división por cero", () => {
    expect(equivalentesVendidos(1000, 0)).toBe(0);
  });
});
