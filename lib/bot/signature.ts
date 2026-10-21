import { createHmac, timingSafeEqual } from "node:crypto";

// Firma compartida entre la web y n8n (ambos sentidos). Única implementación:
// las rutas /api/bot/* verifican con esto y /api/chat firma con esto.

export const SIGNATURE_HEADER = "x-hub-signature-256";
export const TIMESTAMP_HEADER = "x-bot-timestamp";
export const MAX_SKEW_SECONDS = 300;

/** Devuelve el valor completo del encabezado: "sha256=<hex>" sobre `${timestamp}.${body}`. */
export function signPayload(secret: string, timestamp: number | string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/** true solo si la firma corresponde y el timestamp está dentro de la ventana. Nunca lanza. */
export function verifySignature(input: {
  secret: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  body: string;
  nowSeconds: number;
}): boolean {
  const { secret, signatureHeader, timestampHeader, body, nowSeconds } = input;
  if (!signatureHeader || !timestampHeader || !/^\d+$/.test(timestampHeader)) return false;
  if (Math.abs(nowSeconds - Number(timestampHeader)) > MAX_SKEW_SECONDS) return false;
  if (!signatureHeader.startsWith("sha256=")) return false;

  const expected = Buffer.from(signPayload(secret, timestampHeader, body));
  const received = Buffer.from(signatureHeader);
  // timingSafeEqual lanza si las longitudes difieren.
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
