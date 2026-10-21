---
name: verificar-cambio
description: Corre el gate del repo (tipos, lint, unitarias y, si se tocó el sitio público, E2E) antes de dar una tarea por hecha. Úsala cuando digas "verifica", "corre el gate", "¿pasa todo?", "ya quedó" o antes de marcar done una tarea de blueprints/chatbot-ventas/tasks.json.
---

# Verificar cambio

## When to use
- Antes de marcar `done` una tarea de `blueprints/chatbot-ventas/tasks.json` (además de su propio arreglo `verify`).
- Antes de un commit o de abrir un PR.
- Cuando alguien pregunte si "todo pasa".

## Steps
1. Desde la raíz del repo, corre en orden y detente en el primero que falle:
   1. `npx tsc --noEmit` — el build de Next ignora errores de tipos, así que esta es la única red.
   2. `npm run lint`
   3. `npm test`
2. Si el cambio tocó `app/layout.tsx`, `app/page.tsx`, `app/recetas/**`, `components/ui/**` o `lib/site.ts`, corre también `npm run test:e2e` (Playwright arranca `npm run dev` con `NEXT_PUBLIC_CHAT_ENABLED=1`; detén antes cualquier `npm run dev` que corra sin esa variable).
3. Si el cambio tocó `prisma/schema.prisma`, corre también
   `DATABASE_URL=postgresql://u:p@localhost:5432/db DIRECT_URL=postgresql://u:p@localhost:5432/db npx prisma validate`.
4. Reporta cada comando con su resultado. Un fallo se corrige en el código, nunca editando el comando.

## Verify
```bash
npx tsc --noEmit   # expect: exit 0, 0 errores
npm run lint       # expect: exit 0
npm test           # expect: exit 0, 0 failed
```

## Do not
- No marques una tarea como hecha con un comando en rojo.
- No corras `prisma migrate dev`, `migrate reset`, `migrate deploy`, `db push` ni el seed: `.env` apunta a producción.
- No leas `.env` ni `.env.local` para "depurar" una variable.
