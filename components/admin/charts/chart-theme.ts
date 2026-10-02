// Paleta validada (skill dataviz), pasos para SUPERFICIE OSCURA.
// Validador: todos los checks PASS en modo oscuro para las series usadas.

export const CHART = {
  // Categóricas (línea: Estimado vs Real)
  series1: "#0d9488", // azul  — Valor Estimado
  series2: "#d95926", // naranja — Vendido Real

  // Magnitud (ranking de sucursales) — un solo tono azul
  single: "#d95926",

  // Estado (semáforo de vendedoras) — paleta de status reservada
  status: {
    GREEN: "#0ca30c",
    YELLOW: "#fab219",
    RED: "#d03b3b",
  } as const,

  // Tinta y cromo del chart (modo oscuro)
  ink: {
    primary: "#ffffff",
    secondary: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    baseline: "#383835",
  },
  surface: "#141413", // fondo del tooltip
} as const;

export const TIER_LABEL: Record<"GREEN" | "YELLOW" | "RED", string> = {
  GREEN: "Buena",
  YELLOW: "Regular",
  RED: "Baja",
};

export const currency = (n: number): string =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
