/**
 * Dirección pública del sitio, para armar enlaces que salen por correo.
 *
 * No se toma de la cabecera `Host` de la petición: así un enlace de
 * recuperación nunca puede apuntar a un dominio que no sea el nuestro.
 *  1. APP_URL, si se definió (dominio propio).
 *  2. En Vercel, el dominio de producción del proyecto (variable del sistema).
 *  3. En desarrollo, localhost.
 */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
