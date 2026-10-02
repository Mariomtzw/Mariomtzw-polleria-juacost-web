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
- Tipos: `npx tsc --noEmit` — **ejecútalo siempre a mano**: `next.config.ts` ignora errores de tipos en el build. Hoy pasa en 0 errores; mantenlo así
- Lint: `npm run lint`
- Unitarias: `npm test`
- E2E: `npm run test:e2e` (requiere `npm run dev` corriendo, o `E2E_BASE_URL`)
- BD: `npx prisma migrate dev`, `npm run db:seed`, `npm run db:studio`
- Emergencia: `npm run password:reset -- correo@ejemplo.com` pone una contraseña temporal al dueño (usa la base del `.env`)

## Estructura

- `app/page.tsx`, `app/recetas/` — sitio público (client components)
- `app/(admin)/admin/login/`, `recuperar/`, `restablecer/` — entrar y recuperar la contraseña (públicas, sin sesión)
- `app/(admin)/admin/(dashboard)/` — panel: `captura`, `precios`, `ventas`, `frio`, `pedidos`, `corte`, `analitica`, `sobrantes`, `cuenta`
- `app/(admin)/admin/layout.tsx` — título y `noindex` de todo el panel. `app/robots.ts` — bloquea `/admin` y `/api`
- `app/api/` — `auth`, `blob/upload`, `export/xlsx`, `cron/refresh-forecasts`
- `components/ui/` — piezas del sitio público (lamp, aurora-button, scroll-expansion-hero, whatsapp-float)
- `lib/site.ts` — datos de contacto del sitio público. `app/recetas/recetas-data.ts` — las recetas
- `components/admin/` — piezas del panel (`ui/`, `dashboard/`, `charts/`, `forms/`)
- `lib/actions/` — Server Actions (mutaciones). `lib/queries/` — lecturas para páginas
- `lib/pricing.ts`, `lib/calculations.ts` — fórmulas de negocio. `lib/datascience/` — pronóstico y patrones
- `lib/validation.ts` — esquemas zod. `lib/auth-guards.ts` — `getOwnerSession` / `requireOwner` / `assertOwner`
- `lib/account/` — reglas de contraseña (`password-policy.ts`) y enlaces firmados de recuperación (`tokens.ts`). `lib/mail.ts` — correo por Resend. `lib/app-url.ts` — dirección pública del sitio
- `components/admin/account/` — pantallas sin sesión (`AuthShell`) y formularios de Mi cuenta
- `lib/dates.ts` — el "día del negocio" (hora de México): `todayISO`, `shiftISO`, `resolveDateParam`, `businessToday`, `formatDateShort`, `formatDateLong`
- `prisma/schema.prisma`, `prisma/seed.ts` — modelo y datos iniciales (9 puestos, 8 piezas, usuario OWNER)
- `auth.config.ts` (edge-safe), `auth.ts` (Node), `proxy.ts` (protege `/admin/*`)

## Convenciones

- Alias de imports: `@/` apunta a la raíz del repo
- Todo el texto visible va en español (es-MX). Dinero con `currency()` de `components/admin/charts/chart-theme.ts`
- Fechas de negocio como cadena `YYYY-MM-DD`; en Prisma son `@db.Date`
- **"Hoy" siempre sale de `lib/dates.ts`** (`todayISO()`, `resolveDateParam()`, `businessToday()`). Nunca `new Date().toISOString().slice(0, 10)`: Vercel corre en UTC y desde las 6 de la tarde (hora de México) eso ya es mañana
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
- La sesión se revalida contra la base en cada petición (`getOwnerSession`): guarda la huella `pv` de la contraseña con la que se entró, así que **cambiar la contraseña cierra todas las sesiones**. Nunca valides solo con `auth()`: usa `getOwnerSession()`
- Únicas Server Actions sin `assertOwner()`: `requestPasswordReset`, `checkResetLink` y `resetPassword` en `lib/actions/account.ts` (el dueño no tiene sesión). Su prueba de identidad es el enlace firmado
- Recuperación de contraseña: enlace firmado con `AUTH_SECRET` + hash vigente, sin tabla en la base; vence en 30 minutos y es de un solo uso. La respuesta es idéntica exista o no el correo. Máximo 3 correos por usuario cada 15 minutos (se cuenta en `AuditLog`)
- Si cambia `AUTH_SECRET`, se cierran todas las sesiones y mueren los enlaces pendientes
- Las rutas públicas de `/admin` se listan en `PUBLIC_ADMIN_PATHS` de `auth.config.ts`
- En Next 16 el archivo se llama `proxy.ts`, no `middleware.ts`. No crees `middleware.ts`
- `auth.config.ts` corre en el Edge: no importes Prisma ni bcryptjs ahí
- `/api/cron/refresh-forecasts` no tiene sesión; se protege con `Authorization: Bearer $CRON_SECRET`
- Nunca leas, imprimas ni subas `.env`, `.env.local` ni `_to_delete/.env.bak`. Variables nuevas se documentan en `.env.example` (plantilla versionada, sin claves reales)
- El repositorio es **público**: ninguna contraseña, token ni URL de base de datos en el código. `prisma/seed.ts` exige `OWNER_PASSWORD` (no hay clave por defecto)
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

- Todo va dentro de `.admin` (tema oscuro, acento naranja). Superficies con `.material` (tarjetas `rounded-3xl`); `<Panel>` es la misma tarjeta con entrada animada
- Piezas compartidas, definidas una sola vez en `app/globals.css` (`@layer components`): campos `.field` (+ `.field-num` para números, `.field-label` para la etiqueta), botones `.btn` + `.btn-primary | .btn-secondary | .btn-ghost | .btn-danger` (+ `.btn-sm`, `.btn-icon`) y tablas `.table` (+ `.num`, `.sticky-col`). No repitas cadenas largas de utilidades para estas piezas
- Componentes en `components/admin/ui/`: `PageHeader` (un solo `<h1>` por pantalla) y `SectionTitle`, `DateNav` (pantallas por día), `TierBadge` (semáforo), `Notice` (resultado de una acción), `ConfirmDelete` (borrar en dos pasos), `SubmitButton`
- Pantallas por día (`captura`, `corte`, `frio`): la fecha llega por `?date=` y se resuelve con `resolveDateParam()`. Los componentes cliente que guardan estado editable se montan con `key={date}` para que nunca se mezclen los datos de dos días
- Estado editable + `router.refresh()`: deriva las filas de las props y guarda aparte solo los cambios sin guardar (ver `ColdManager`); un `useState(() => props…)` no se entera de los datos nuevos
- Formularios: `onSubmit` + `preventDefault` (no `action={fn}`), para que un error del servidor no borre lo escrito. Los campos opcionales vacíos se omiten antes de enviar (vacío no es 0)
- Todo campo lleva `<label htmlFor>` o `aria-label`; los botones de solo icono llevan `aria-label` y el icono `aria-hidden`
- Colores de gráficas solo desde `CHART` en `components/admin/charts/chart-theme.ts`
- El estado nunca se comunica solo con color: icono o etiqueta además del tono
- Texto secundario en `text-neutral-400` como mínimo (`neutral-500` no alcanza contraste sobre el fondo oscuro)
- Verifica en 390 y 1440 px: en el teléfono la captura se muestra como tarjetas y ninguna pantalla debe desplazarse hacia los lados

### Skills de diseño (`.claude/skills/`)

- `design-taste-frontend` y `redesign-existing-projects` (taste-skill): solo para el sitio público; no aplican a dashboards
- `impeccable`: `/impeccable audit|critique|polish <ruta>`. Detector: `.claude/skills/impeccable/scripts/impeccable detect <url>`
- `ui-ux-pro-max`: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --domain ux`
- `playwright-cli`: capturas y pruebas en navegador (requiere `npm install -g @playwright/cli`)

## Trampas conocidas

- `_to_delete/` y los archivos `.fuse_hidden*` son basura de sesiones anteriores (están en `.gitignore`): no los importes, edites ni tomes como referencia
- `npx tsc --noEmit`, `npm run lint` y `npm test` pasan limpios (0 errores, 35 pruebas). Un cambio no debe romper ninguno de los tres
- Recharts 3: el valor del `formatter` del `Tooltip` no viene tipado como número; conviértelo con `Number(v)`
- Un texto `sr-only` dentro de una tabla con desplazamiento horizontal ensancha la página si la tabla no es `position: relative` (`.table` ya lo es)
- `prisma.config.ts` carga `.env` a mano; Prisma ya no lo hace solo
- El número de puestos sale de la base (puestos activos); solo el seed lista los 9 iniciales
- `components/admin/ExcelUpload.tsx`, `StatTiles.tsx` y `charts/SalesTrendChart.tsx` no se usan en ninguna pantalla; `/admin/sobrantes` existe pero no está en el menú
- `next/font/google` (Geist) necesita red en build y en dev
- Correo: sin dominio verificado en Resend, el remitente de pruebas (`onboarding@resend.dev`) solo entrega al correo dueño de la cuenta de Resend. En desarrollo, sin `RESEND_API_KEY`, el correo se escribe en la terminal; en producción nunca se imprime
- bcrypt ignora lo que pase de 72 bytes: por eso la contraseña tiene máximo además de mínimo
