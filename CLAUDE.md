# Pollos Juacos't

Sitio público de la pollería (landing + recetas) y panel privado `/admin` para el dueño:
captura diaria de 9 puestos, precios de despiece, pollo frío, pedidos, corte y analítica.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript `strict`
- Tailwind CSS v4: **no hay `tailwind.config`**; los tokens viven en `@theme` dentro de `app/globals.css`
- framer-motion, lucide-react, recharts
- Prisma 6 + PostgreSQL (Supabase). Auth.js v5 beta (Credentials + JWT)
- zod (validación), exceljs (importar/exportar), @vercel/blob (adjuntos)
- Jest + ts-jest (unitarias), Playwright (E2E). Deploy en Vercel con un cron diario

## Comandos

- Desarrollo: `npm run dev` (http://localhost:3000)
- Tipos: `npx tsc --noEmit` — **ejecútalo siempre a mano**: `next.config.ts` ignora errores de tipos y de lint en el build
- Lint: `npm run lint`
- Unitarias: `npm test`
- E2E: `npm run test:e2e` (requiere `npm run dev` corriendo, o `E2E_BASE_URL`)
- BD: `npx prisma migrate dev`, `npm run db:seed`, `npm run db:studio`

## Estructura

- `app/page.tsx`, `app/recetas/` — sitio público (client components)
- `app/(admin)/admin/login/` — login del dueño
- `app/(admin)/admin/(dashboard)/` — panel: `captura`, `precios`, `ventas`, `frio`, `pedidos`, `corte`, `analitica`, `sobrantes`
- `app/api/` — `auth`, `blob/upload`, `export/xlsx`, `cron/refresh-forecasts`
- `components/ui/` — piezas del sitio público (lamp, aurora-button, scroll-expansion-hero, whatsapp-float)
- `lib/site.ts` — datos de contacto del sitio público. `app/recetas/recetas-data.ts` — las recetas
- `components/admin/` — piezas del panel (`ui/`, `dashboard/`, `charts/`, `forms/`)
- `lib/actions/` — Server Actions (mutaciones). `lib/queries/` — lecturas para páginas
- `lib/pricing.ts`, `lib/calculations.ts` — fórmulas de negocio. `lib/datascience/` — pronóstico y patrones
- `lib/validation.ts` — esquemas zod. `lib/auth-guards.ts` — `requireOwner` / `assertOwner`
- `prisma/schema.prisma`, `prisma/seed.ts` — modelo y datos iniciales (9 puestos, 8 piezas, usuario OWNER)
- `auth.config.ts` (edge-safe), `auth.ts` (Node), `proxy.ts` (protege `/admin/*`)

## Convenciones

- Alias de imports: `@/` apunta a la raíz del repo
- Todo el texto visible va en español (es-MX). Dinero con `currency()` de `components/admin/charts/chart-theme.ts`
- Fechas de negocio como cadena `YYYY-MM-DD`; en Prisma son `@db.Date`
- Los `Decimal` de Prisma se convierten con `.toNumber()` antes de pasarlos a componentes cliente
- Server Actions: `"use server"`, primera línea `await assertOwner()`, validar con zod, devolver `ActionResult` (`{ ok: true, data } | { ok: false, error }`) y llamar `revalidatePath`
- Páginas del panel: server components que leen con funciones de `lib/queries/`; los formularios y rejillas son client components
- `searchParams` es una `Promise` en Next 16: `const sp = await searchParams`

## Reglas de negocio

- `precioPorPieza = pechuga + 2·pierna + 2·ala + huacal + rabadilla + hígado + 2·pata + cabeza`. La única implementación es `precioPorPieza()` en `lib/pricing.ts`; no la dupliques
- Cada venta diaria guarda un *snapshot* de los 8 precios; cambiar una `PriceList` no reescribe el historial
- Una venta por puesto y día: `@@unique([date, branchId])`, siempre con `upsert`
- Semáforo: `diferencia = pollosAsignados − vendidoReal / precioPorPieza`; umbrales en `AppSetting` (`tier.green.max`, `tier.yellow.max`), por defecto 1 y 5
- La vendedora se confirma en cada captura porque rotan entre puestos

## Seguridad

- Tres capas, las tres obligatorias: `proxy.ts` (borde), `requireOwner()` en el layout del panel, `assertOwner()` en cada Server Action y route handler
- En Next 16 el archivo se llama `proxy.ts`, no `middleware.ts`. No crees `middleware.ts`
- `auth.config.ts` corre en el Edge: no importes Prisma ni bcryptjs ahí
- `/api/cron/refresh-forecasts` no tiene sesión; se protege con `Authorization: Bearer $CRON_SECRET`
- Nunca leas, imprimas ni subas `.env`, `.env.local` ni `_to_delete/.env.bak`. Variables nuevas se documentan en `.env.example`
- `DATABASE_URL` es la conexión con pooler (runtime); `DIRECT_URL` es la directa (migraciones). `.env.local` apunta a la base real: no corras `migrate reset` ni el seed sin confirmación

## Diseño

Este sitio se pule conservando la identidad: no cambies marca, textos, etiquetas del menú ni rutas sin que se pida.

### Sitio público (landing y recetas)

- Todo va dentro de `.site` (clase en el `<main>` y en el botón de WhatsApp): ahí se definen el foco de teclado y la selección
- Fuente: Geist, cargada en `app/layout.tsx` y conectada a `font-sans` con `@theme inline` en `globals.css`
- Colores solo con tokens: `brand-red`, `brand-red-dark`, `brand-yellow`, `brand-yellow-light`. `brand-red-deep` es solo para sombras y cantos
- Contraste: rojo sobre amarillo da 3.6:1, así que solo se usa en títulos grandes (24 px o más, en negritas). El texto pequeño sobre amarillo va en `brand-red-dark` (4.7:1) y el texto pequeño sobre rojo va en blanco, no en amarillo
- Foco: cada superficie define `--focus-ring` según su fondo (blanco sobre rojo, `brand-red-dark` sobre amarillo, `brand-red` sobre blanco)
- Sombras: `shadow-brand` (teñida de rojo). No uses `shadow-2xl` ni negro puro
- Teléfonos, WhatsApp, correo, dirección y horario viven en `lib/site.ts`; los enlaces de WhatsApp se arman con `whatsappUrl()`
- Recetas: los datos están en `app/recetas/recetas-data.ts` (ingredientes, cocción y pasos como listas). Iconos de lucide, nunca emojis
- Imágenes con `next/image`. Formularios con `<label>` visible, nunca solo `placeholder`
- Movimiento: cada página va envuelta en `MotionConfig reducedMotion="user"`. No cambies el `initial` de framer-motion según `useReducedMotion()` (rompe la hidratación); cambia la `transition`
- Verifica en 360, 390, 768, 1024 y 1440 px

### Panel

- Todo va dentro de `.admin` (tema oscuro, acento naranja). Superficies con `.material`, botones con `.press`, tarjetas con `<Panel>`
- Colores de gráficas solo desde `CHART` en `components/admin/charts/chart-theme.ts`
- El estado nunca se comunica solo con color: icono o etiqueta además del tono

### Skills de diseño (`.claude/skills/`)

- `design-taste-frontend` y `redesign-existing-projects` (taste-skill): solo para el sitio público; no aplican a dashboards
- `impeccable`: `/impeccable audit|critique|polish <ruta>`. Detector: `.claude/skills/impeccable/scripts/impeccable detect <url>`
- `ui-ux-pro-max`: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --domain ux`
- `playwright-cli`: capturas y pruebas en navegador (requiere `npm install -g @playwright/cli`)

## Trampas conocidas

- `_to_delete/` y los archivos `.fuse_hidden*` son basura de sesiones anteriores: no los importes, edites ni tomes como referencia
- `npx tsc --noEmit` ya reporta 6 errores previos en código real: el `formatter` del `Tooltip` de recharts (4 gráficas), `auth.config.ts` y un `Buffer` en `lib/import/parseSalesXlsx.ts`. Un cambio no debe sumar errores nuevos
- `prisma.config.ts` carga `.env` a mano; Prisma ya no lo hace solo
- El número de puestos (9) está escrito a mano en `CaptureGrid.tsx` (`/9`) y en el seed
- `next/font/google` (Geist) necesita red en build y en dev
