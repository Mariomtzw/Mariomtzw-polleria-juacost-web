// Datos de contacto del sitio público. Una sola fuente para landing, recetas
// y el botón flotante: si cambia un teléfono, se cambia aquí.

export const SITE = {
  name: "Pollos Juacos't",
  // wa.me exige formato internacional: 52 (México) + los 10 dígitos, sin "+" ni espacios.
  whatsapp: "522283576092",
  phones: [
    { label: "2282 10 53 30", tel: "+522282105330" },
    { label: "2283 57 60 92", tel: "+522283576092" },
  ],
  email: "pollosjuacost@gmail.com",
  address: "Hidalgo #73, Banderilla Centro",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Hidalgo 73, Centro, Banderilla, Veracruz"),
  hours: "Lunes a Domingo: 7:00 AM - 3:00 PM",
} as const;

/** Enlace de WhatsApp con el mensaje ya codificado (acentos, saltos de línea, &, #). */
export function whatsappUrl(message: string, to: string = SITE.whatsapp): string {
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}

/** Número de los botones de pedido: el del bot si NEXT_PUBLIC_WHATSAPP_BOT trae 52 + 10 dígitos (12 en total); si no, el de SITE. */
const botNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT ?? "";
export const WHATSAPP_PEDIDOS: string = /^\d{12}$/.test(botNumber) ? botNumber : SITE.whatsapp;
