# Pollos Juacos't — instrucciones para agentes

Sitio público de la pollería (landing, recetas, chat de ventas) y panel privado `/admin` para el dueño.
Next.js 16 + React 19 + TypeScript `strict` + Prisma 6 (Supabase) + Tailwind v4. El bot de ventas vive en n8n Cloud.

## Comandos

| Tarea | Comando |
|---|---|
| Desarrollo | `npm run dev` (http://localhost:3000) |
| Tipos | `npx tsc --noEmit` (el build ignora tipos: córrelo siempre) |
| Lint | `npm run lint` |
| Unitarias | `npm test` · una: `npm test -- __tests__/<archivo>.test.ts` |
| E2E | `npm run test:e2e` · una: `npm run test:e2e -- chat-widget` |
| Prisma (offline) | `DATABASE_URL=postgresql://u:p@localhost:5432/db DIRECT_URL=postgresql://u:p@localhost:5432/db npx prisma validate` |

**Gate:** `npx tsc --noEmit && npm run lint && npm test` antes de dar algo por hecho.

## Reglas que rompen cosas

1. Nunca leas, imprimas ni subas `.env` ni `.env.local`: apuntan a la base de producción. Nunca `prisma migrate dev`, `migrate reset`, `migrate deploy`, `db push` ni el seed sin confirmación del dueño.
2. El repositorio es público: ningún secreto, token, URL de base ni el número personal del dueño en el código ni en `n8n/`.
3. Ningún prompt ni llamada a un modelo de lenguaje en `app/`, `lib/` o `components/`: el cerebro del bot vive en n8n.
4. `/api/bot/*` verifica la firma HMAC (`BOT_WEBHOOK_SECRET`) sobre el cuerpo crudo antes de parsearlo; el total de un pedido lo calcula siempre el servidor con `precioPorPieza()`.
5. Cada Server Action empieza con `await assertOwner()`, valida con zod y devuelve `{ ok: true, data } | { ok: false, error }`.
6. "Hoy" sale siempre de `lib/dates.ts`; nunca `new Date().toISOString().slice(0, 10)`.
7. Todo texto visible va en español (es-MX).

Arquitectura completa, convenciones, diseño y reglas por área: `CLAUDE.md` en este directorio y `.claude/rules/`.
Build del chatbot en curso: `blueprints/chatbot-ventas/tasks.json` y `blueprints/chatbot-ventas/epics/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
