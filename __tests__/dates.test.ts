// Protege el "día del negocio": el panel no debe saltar a mañana por la tarde.
import { formatDateLong, formatDateShort, isISODate, resolveDateParam, shiftISO, todayISO } from "@/lib/dates";

describe("todayISO (día en hora de México)", () => {
  it("a las 8 de la noche en México sigue siendo el mismo día (en UTC ya es mañana)", () => {
    // 2026-10-02 02:17 UTC = 2026-10-01 20:17 en Ciudad de México
    expect(todayISO(new Date("2026-10-02T02:17:00Z"))).toBe("2026-10-01");
  });

  it("al mediodía coincide con la fecha UTC", () => {
    expect(todayISO(new Date("2026-10-01T18:00:00Z"))).toBe("2026-10-01");
  });

  it("cambia de día a la medianoche de México (06:00 UTC)", () => {
    expect(todayISO(new Date("2026-10-02T05:59:00Z"))).toBe("2026-10-01");
    expect(todayISO(new Date("2026-10-02T06:00:00Z"))).toBe("2026-10-02");
  });
});

describe("shiftISO", () => {
  it("avanza y retrocede días cruzando meses y años", () => {
    expect(shiftISO("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftISO("2028-02-28", 1)).toBe("2028-02-29"); // bisiesto
  });
});

describe("isISODate / resolveDateParam", () => {
  it("acepta solo fechas reales con forma YYYY-MM-DD", () => {
    expect(isISODate("2026-10-01")).toBe(true);
    expect(isISODate("2026-02-31")).toBe(false);
    expect(isISODate("01/10/2026")).toBe(false);
    expect(isISODate(undefined)).toBe(false);
  });

  it("usa el parámetro válido y, si no, el día de hoy", () => {
    expect(resolveDateParam("2026-09-15")).toBe("2026-09-15");
    expect(resolveDateParam("mañana")).toBe(todayISO());
  });
});

describe("formato en español", () => {
  it("escribe la fecha corta y la larga", () => {
    expect(formatDateShort("2026-10-01")).toBe("jue 1 oct");
    expect(formatDateLong("2026-10-01")).toBe("jueves 1 de octubre de 2026");
    expect(formatDateShort("2026-09-30")).toBe("mié 30 sep");
  });
});
