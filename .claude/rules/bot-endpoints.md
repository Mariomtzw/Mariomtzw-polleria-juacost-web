---
description: Endpoints del chatbot de ventas (firma HMAC, pedidos, proxy del chat)
paths:
  - "app/api/bot/**"
  - "app/api/chat/**"
  - "lib/bot/**"
---

# Endpoints del bot

- Rutas sin sesión: no importan `@/auth` ni `@/lib/auth-guards`. Su prueba de identidad es la firma (`/api/bot/*`) o nada (`/api/chat`, pública).
- Responden con `Response.json(...)` estándar (no `NextResponse`) y el envelope del repo: `{ ok: true, data }` o `{ ok: false, error: "<mensaje en español>" }`.
- `export const dynamic = "force-dynamic"` en las tres rutas; `/api/chat` además `export const maxDuration = 30`.
- Orden en `/api/bot/*`: 500 si falta `BOT_WEBHOOK_SECRET` → `await request.text()` → `verifySignature` (401) → `JSON.parse` (400) → zod (400 con el primer mensaje) → `getBotCatalog()` (503 si no está configurado) → trabajo.
- Solo `lib/bot/signature.ts` firma o verifica. Cadena: `${timestamp}.${body}`; encabezados `X-Hub-Signature-256: sha256=<hex>` y `X-Bot-Timestamp`; ventana de 300 s; `timingSafeEqual` con longitudes comprobadas. En GET el cuerpo firmado es `""`.
- El total se recalcula con `quoteOrder(items, catalog.items)`; cualquier `total`/`amount` del payload se ignora (zod lo elimina).
- `POST /api/bot/pedidos`: `prisma.order.upsert({ where: { externalId }, create: { status: "PENDING", … }, update: {} })`; si lanza `code === "P2002"`, `findUnique` por `externalId`. La respuesta se arma desde la fila guardada.
- `/api/chat` reenvía `JSON.stringify({ sessionId: "web:" + sessionId, messageId, message })` firmado, con `AbortSignal.timeout(25000)`; cualquier fallo de n8n → 502 `No pude responder ahora. Llámanos o escríbenos por WhatsApp.`
- Nunca registres en logs el mensaje, el cuerpo, la firma ni datos del cliente.
- Ningún prompt, modelo ni nombre de proveedor de LLM en estos archivos.
- Fechas y horas del negocio con `lib/dates.ts` y `businessMinutes()` de `lib/bot/order.ts`.
- Pruebas: `__tests__/bot-signature.test.ts`, `__tests__/bot-order.test.ts`, `__tests__/bot-routes.test.ts`, `__tests__/chat-route.test.ts`. Simula `@/lib/prisma` y fija `process.env` en cada prueba.
