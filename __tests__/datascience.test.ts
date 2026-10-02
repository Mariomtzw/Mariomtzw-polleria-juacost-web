// Protege la lógica predictiva: comparación estadística, distancia y quincenas.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import { compareGroups, haversineKm, median, mean } from "@/lib/datascience/stats";
import { isPayday } from "@/lib/datascience/factors";

describe("compareGroups (Welch t-test)", () => {
  it("detecta una caída y reporta % negativo con confianza", () => {
    const base = [3000, 3100, 2950, 3050, 3000, 2980, 3020];
    const rainy = [2400, 2350, 2450, 2500, 2380]; // ~-20%
    const cmp = compareGroups(base, rainy);
    expect(cmp.pctChange).toBeLessThan(-10);
    expect(cmp.pValue).toBeLessThan(0.05);
    expect(cmp.confidence).toBe("high");
  });

  it("no da alta confianza con muestras diminutas", () => {
    const cmp = compareGroups([3000, 3050], [3500]);
    expect(cmp.confidence).not.toBe("high");
  });

  it("media y mediana básicas", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(median([5, 1, 3])).toBe(3);
  });
});

describe("haversineKm", () => {
  it("CDMX → Puebla ≈ 100 km (±15)", () => {
    const d = haversineKm({ lat: 19.4326, lng: -99.1332 }, { lat: 19.0414, lng: -98.2063 });
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(120);
  });

  it("misma coordenada = 0 km", () => {
    expect(haversineKm({ lat: 19, lng: -99 }, { lat: 19, lng: -99 })).toBeCloseTo(0, 5);
  });
});

describe("isPayday (quincena)", () => {
  it("día 15 y último del mes son quincena", () => {
    expect(isPayday("2026-04-15")).toBe(true);
    expect(isPayday("2026-04-30")).toBe(true); // abril: 30 días
    expect(isPayday("2026-02-28")).toBe(true); // febrero no bisiesto
  });

  it("un día cualquiera no es quincena", () => {
    expect(isPayday("2026-04-10")).toBe(false);
  });
});
