/**
 * Reglas para una contraseña nueva. Archivo sin dependencias: se usa igual en
 * el navegador (aviso inmediato) y en el servidor (la validación que cuenta).
 */
export const PASSWORD_MIN_LENGTH = 10;
/** bcrypt solo toma en cuenta los primeros 72 bytes: más largo no protege más. */
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_HINT = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres. Una frase de varias palabras es más segura y más fácil de recordar.`;

const TOO_COMMON = new Set([
  "1234567890",
  "0123456789",
  "0987654321",
  "contraseña",
  "contrasena",
  "password123",
  "qwertyuiop",
  "pollosjuacost",
  "cambiaestaclave123",
]);

/**
 * Devuelve el problema de la contraseña en una frase, o `null` si es válida.
 * `email` (opcional) evita usar el propio correo como contraseña.
 */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `La contraseña es demasiado larga (máximo ${PASSWORD_MAX_BYTES} caracteres).`;
  }
  if (password.trim() !== password) {
    return "La contraseña no puede empezar ni terminar con un espacio.";
  }
  if (new Set(password).size < 4) {
    return "La contraseña repite muy pocos caracteres. Usa una más variada.";
  }
  const lower = password.toLowerCase();
  if (TOO_COMMON.has(lower)) {
    return "Esa contraseña es demasiado común. Elige otra.";
  }
  if (email && (lower === email.toLowerCase() || lower === email.toLowerCase().split("@")[0])) {
    return "La contraseña no puede ser tu correo.";
  }
  return null;
}
