---
name: contrato-nuevo
description: Usar cuando un módulo de Henko necesita una API, un error o un evento nuevo, o cambiar uno existente — «nuevo endpoint», «el front necesita X del back», «contracts-<módulo>», «agregá el evento». El contrato zod en henko-contracts va antes que el servicio y que la pantalla.
---

# Contrato nuevo (henko-contracts)

El contrato es la fuente de verdad entre el front, el BFF y los módulos:
**se cambia primero acá** y después los servicios. Leé el README de
`henko-contracts` (reglas y versionado),
`${CLAUDE_PLUGIN_ROOT}/estandares/codigo.md` y
`${CLAUDE_PLUGIN_ROOT}/estandares/errores.md`. Si el pedido viene del front,
leé también `henko-web/docs/back/<entidad>.md`: es el borrador de lo que la
pantalla necesita.

## Dónde

- Un paquete por módulo: `packages/contracts-<módulo>` (copiá la forma de
  `contracts-identity`: `package.json` con `exports` y `henko-source`,
  `src/index.ts`, `src/<módulo>.ts`, `src/contracts.test.ts`).
- Sólo schemas y tipos: nada de lógica ni llamadas HTTP.
- No toques paquetes de otros módulos para el tuyo; si algo es común (roles,
  flags) ya tiene su paquete.

## Qué lleva

1. **Schemas zod** de request y response por ruta
   (`createXRequestSchema`, `createXResponseSchema`) y de cada entidad
   (`xSchema`), con los tipos con `z.infer` (o `z.input` si hay defaults).
2. **Reglas de datos**: ids UUIDv7, fechas ISO en UTC, plata en centavos
   (enteros), `localId` cuando el dato es de un local. Mensajes de
   validación en castellano.
3. **Errores**: `X_ERRORS = ['<módulo>.<algo>', …] as const` y
   `XErrorKey`; el servicio los define con `satisfies Record<XErrorKey, …>`
   para que falte uno y no compile.
4. **Eventos**: `<módulo>.<entidad>.<hecho>.v<n>` con su schema de payload.
5. **Tests** en `contracts.test.ts`: lo válido pasa, lo inválido no.

## Versionar

- Cambio que no rompe (campo opcional nuevo, ruta nueva): sube el minor
  en 1.x o el patch en 0.x.
- Cambio que rompe (sacar o renombrar un campo, cambiar un tipo): sube el
  mayor (en 0.x, el minor) y la versión vieja convive hasta que nadie la use.
- Publicar: subir `version` y llegar a `main` (sale sola). Después, cada
  repo sube la dependencia (Renovate abre el PR agrupado de
  `@henko-software/*`).

`git pull --rebase` antes de pushear: en henko-contracts trabaja más de una
persona a la vez.
