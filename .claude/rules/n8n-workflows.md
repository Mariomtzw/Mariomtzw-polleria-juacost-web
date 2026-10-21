---
description: Workflows de n8n versionados (sin secretos) y prompt del agente
paths:
  - "n8n/**"
---

# Workflows de n8n

- El repositorio es público. En `n8n/` no hay tokens, claves, URLs con credenciales ni números de teléfono (ninguna secuencia de 10 o más dígitos fuera de los campos `id` y `webhookId`). El número del dueño vive solo en la variable `OWNER_WHATSAPP` de n8n.
- Credenciales solo por nombre: `"credentials": { "<tipo>": { "name": "<nombre del README>" } }`, sin `id`. Nombres: `WhatsApp Pollos`, `WhatsApp Pollos (trigger)`, `Anthropic Pollos`, `OpenAI Pollos`, `Supabase Pollos (memoria)`.
- Valores de configuración con `$vars`: `WEB_BASE_URL`, `BOT_WEBHOOK_SECRET`, `OWNER_WHATSAPP`, `WHATSAPP_PHONE_NUMBER_ID`.
- `n8n/prompts/agente-sistema.md` es la fuente del prompt; `agente.json` lo lleva idéntico en `options.systemMessage` del nodo agent. Si cambias uno, cambia el otro: la prueba los compara.
- Herramientas del agente: exactamente `consultar_catalogo`, `crear_pedido`, `escalar_a_persona` (nodos `toolWorkflow` hacia `herramientas.json`).
- Las llamadas a `/api/bot/*` van firmadas: Set (`ts`, `body`) → Crypto HMAC SHA256 hex sobre `ts + '.' + body` con `$vars.BOT_WEBHOOK_SECRET` → HTTP Request con cuerpo crudo igual a `body` y encabezados `X-Hub-Signature-256: sha256=<hex>`, `X-Bot-Timestamp`.
- Un solo nodo WhatsApp Trigger por app de Meta (`whatsapp.json`). Ese nodo ya verifica la firma de Meta: no agregues un nodo Crypto ahí.
- Cada archivo nuevo en `n8n/workflows/` se declara en `EXPECTED` de `__tests__/n8n-workflows.test.ts` con sus tipos de nodo obligatorios; si no, la prueba falla.
- Verifica con `npm test -- __tests__/n8n-workflows.test.ts`.
- Importar a n8n Cloud es manual (ver `n8n/README.md`); ningún paso del build llama a n8n.
