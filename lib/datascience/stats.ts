// Estadística mínima pero real para comparar dos grupos de ventas
// (p. ej. días con lluvia vs días secos) y decidir si la diferencia es confiable.

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
}

export function std(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

// Aproximación de la CDF normal (para convertir un estadístico t en p-valor).
function normalCdf(z: number): number {
  // Abramowitz-Stegun 7.1.26
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export interface Comparison {
  baseMean: number;
  groupMean: number;
  pctChange: number; // % de cambio del grupo respecto a la base
  nBase: number;
  nGroup: number;
  pValue: number; // prob. de que la diferencia sea por azar
  confidence: "low" | "med" | "high";
}

/**
 * Welch t-test (dos muestras, varianzas desiguales). Devuelve el % de cambio,
 * el p-valor y una etiqueta de confianza usable directamente en la UI.
 */
export function compareGroups(base: number[], group: number[]): Comparison {
  const baseMean = mean(base);
  const groupMean = mean(group);
  const pctChange = baseMean !== 0 ? ((groupMean - baseMean) / baseMean) * 100 : 0;

  const vB = variance(base);
  const vG = variance(group);
  const nB = base.length;
  const nG = group.length;

  let pValue = 1;
  if (nB >= 2 && nG >= 2 && vB + vG > 0) {
    const se = Math.sqrt(vB / nB + vG / nG);
    const t = se > 0 ? (groupMean - baseMean) / se : 0;
    pValue = 2 * (1 - normalCdf(Math.abs(t))); // dos colas
  }

  // Confianza combinando tamaño de muestra y p-valor.
  const minN = Math.min(nB, nG);
  let confidence: Comparison["confidence"] = "low";
  if (minN >= 5 && pValue < 0.05) confidence = "high";
  else if (minN >= 3 && pValue < 0.2) confidence = "med";

  return { baseMean, groupMean, pctChange, nBase: nB, nGroup: nG, pValue, confidence };
}

/** Distancia haversine en km entre dos coordenadas. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
