// Tipos compartidos de la capa de Data Science.

export type FactorKey =
  | "RAIN"
  | "HOT"
  | "COLD"
  | "PAYDAY"
  | "NATIONAL_HOLIDAY"
  | "PATRONAL_FIESTA"
  | "MUNICIPAL_FIESTA"
  | "LOCAL_EVENT";

export const FACTOR_LABEL: Record<FactorKey, string> = {
  RAIN: "Lluvia",
  HOT: "Calor",
  COLD: "Frío",
  PAYDAY: "Quincena",
  NATIONAL_HOLIDAY: "Día festivo",
  PATRONAL_FIESTA: "Fiesta patronal",
  MUNICIPAL_FIESTA: "Fiesta municipal",
  LOCAL_EVENT: "Evento local",
};

export interface NearbyFiesta {
  name: string;
  factor: FactorKey; // PATRONAL_FIESTA | MUNICIPAL_FIESTA | LOCAL_EVENT
  distanceKm: number | null;
}

// Factores externos activos en un (puesto, día).
export interface DayFactors {
  date: string; // YYYY-MM-DD
  branchId: string;
  precipitationMm: number | null;
  tempAvgC: number | null;
  rain: boolean;
  hot: boolean;
  cold: boolean;
  payday: boolean;
  nationalHoliday: boolean;
  fiestas: NearbyFiesta[];
  active: FactorKey[]; // lista de factores activos ese día
}

// Un patrón detectado, listo para mostrarse como tarjeta de texto.
export interface Insight {
  id: string;
  scope: "branch" | "global";
  branchId?: string;
  branchName?: string;
  factor: FactorKey;
  eventName?: string; // para fiestas específicas
  direction: "up" | "down" | "flat";
  pctChange: number; // redondeado
  baseMean: number;
  groupMean: number;
  nDays: number; // días observados con el factor
  confidence: "low" | "med" | "high";
  text: string; // frase en español lista para la UI
}
