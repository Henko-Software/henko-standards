# Frontend

Next (App Router) + React + Tailwind con los tokens de `@henko-software/ui` +
next-intl + TanStack Query.

## Capas de `apps/web/src`

| Carpeta            | Qué va                                                                                        | Qué NO va             |
| ------------------ | --------------------------------------------------------------------------------------------- | --------------------- |
| `app/`             | rutas, layouts, providers. Cada `page.tsx` importa su view y nada más.                        | lógica, JSX de verdad |
| `views/<ruta>/`    | `RouteView.tsx` (arma la pantalla) + `useRouteView.ts` (lógica: datos, formularios, acciones) | —                     |
| `features/<tema>/` | piezas de un tema que usan varias pantallas (feedback, pwa)                                   | —                     |
| `components/`      | presentacional propio de la app (AppShell, PageHeader)                                        | lógica de negocio     |
| `data/<entidad>/`  | schema zod, puerto, adaptadores (ver [datos-de-ejemplo.md](datos-de-ejemplo.md))              | —                     |
| `config/`          | navegación (una sola lista), constantes de la app                                             | —                     |
| `i18n/`            | config y `messages/es.json`                                                                   | —                     |

**Regla de oro:** `packages/ui`, `components/` y `features/` son
presentacionales; la lógica vive en `useXxxView.ts`.

**Server/Client:** `'use client'` sólo donde hay interactividad, lo más
abajo posible. Nunca en un layout entero.

## Textos (i18n)

- **Ningún texto visible escrito en el JSX** (ESLint lo corta): todo por
  `useTranslations()` con claves en `messages/es.json`.
- Claves en inglés, `camelCase`, por pantalla o tema
  (`contacts.list.empty`).
- El DS no traduce: recibe textos por props.
- Fechas, números y plata con los helpers de `utils/format.ts`.

## Estilos

- Tailwind; clases condicionales con `cn` (es `clsx`, no `tailwind-merge`).
- Colores sólo desde tokens (`bg-accent`, `text-muted`, `border-border`).
  ESLint corta cualquier hex fuera de `tokens/`.
- En `views/` y `features/`, nada de `<button>`, `<input>`, `<select>`,
  `<textarea>`, `<dialog>`, `<table>` sueltos: se usa el DS.
- El orden de clases lo pone Prettier.

## Imports

Alias absolutos desde `src` (`views/...`, `data/...`); paquetes por nombre
(`@henko-software/ui`). Orden: externos → `@henko-software/*` → alias →
relativos. Lo ordena ESLint.

## Red flags

- Un `page.tsx` con lógica.
- Un componente del DS que importa algo de la app o traduce.
- Una pantalla que importa `data/x/mockAdapter` en vez de `data/x`.
- `'use client'` en un layout entero.
- Una pantalla que nadie abrió a 375px.
