---
name: review-front
description: Usar para revisar un PR o un cambio del front de Henko (henko-web, apps/web, apps/console, packages/ui) antes de mergear — «revisá el PR», «review del front», «¿esto cumple?». Lista lo que se bloquea y lo que se sugiere, con archivo y línea, contra los estándares de agent-rules.
---

# Review de PR del front

Leé primero, de `${CLAUDE_PLUGIN_ROOT}/estandares/` (o de
`node_modules/@henko-software/agent-rules/estandares/` en el repo, que
manda): `frontend.md`, `design-system.md`, `mobile-y-pwa.md`,
`accesibilidad-y-ux.md`, `datos-de-ejemplo.md`, `flags-y-ver-como.md` y
`seo-y-agentes.md`.

## Cómo

1. `gh pr diff <n>` (o `git diff main...`) y `gh pr view <n>` para saber
   qué se quiso hacer. Leé los archivos enteros que cambian, no sólo el
   diff.
2. Corré lo que corre el CI: `pnpm check`, `pnpm typecheck`, `pnpm test` y
   `npx @henko-software/cli doctor`. Si algo falla, eso va primero.
3. Recorré la lista de abajo. Cada hallazgo con **archivo:línea**, qué está
   mal, por qué (el estándar) y cómo se arregla.
4. Separá **bloquea** (rompe un estándar o un flujo) de **sugerencia**.
   Nada de opiniones de estilo que Prettier o ESLint ya resuelven.

## Qué mirar

**Capas**

- `page.tsx` sólo importa su view; la lógica en `useXxxView.ts`.
- Las pantallas usan `data/<entidad>` (el puerto), nunca el adaptador de
  ejemplo ni `fetch` directo.
- Lo que viene de la API pasa por el schema zod del contrato
  (`@henko-software/contracts-bff`).
- `'use client'` lo más abajo posible, nunca en un layout.

**Design system**

- Nada de `<button>`, `<input>`, `<table>`… sueltos ni componentes
  paralelos a los de `@henko-software/ui`; colores sólo por tokens.
- Controles de una fila alineados, misma acción con el mismo botón en todas
  las filas, nada de texto flotante sin panel.

**Textos**: nada escrito en el JSX; claves en `messages/es.json`; fechas y
plata con `utils/format.ts`.

**Mobile y PWA**: capturas a 375px y desktop en el PR (si faltan, bloquea);
nada se sale del ancho.

**Flags y superadmin**: claves que copian la nav; lo que sólo ve el
superadmin lleva el cartel del DS; «ver como» respetado.

**Listados**: filtros acumulables (Y entre filtros, O dentro), en la URL,
resueltos en el back.

**Formularios**: validación zod, estados de carga/vacío/error, nada se
pierde al cerrar.

**Seguridad y SEO**: nada de secretos ni datos reales; lo privado va
`noindex`.

## Salida

```
## Bloquea
- apps/web/src/views/x/XView.tsx:42 — <button> suelto: usar Button del DS (design-system.md).

## Sugerencias
- …

## Bien
- …
```

Si un hallazgo sirve para todos los repos (una regla de lint que falta, un
paso de CI), proponelo para `henko-standards` en vez de dejarlo en el PR.
