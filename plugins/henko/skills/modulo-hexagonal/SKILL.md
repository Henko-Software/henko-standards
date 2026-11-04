---
name: modulo-hexagonal
description: Usar cuando se suma o cambia lógica de negocio en un servicio del back de Henko (un caso de uso, una entidad, un repositorio, un consumidor de eventos, un cliente de otro módulo) o cuando hay dudas de en qué capa va algo — «agregá el endpoint», «nuevo caso de uso», «dónde pongo esto», «el dominio importa X».
---

# Módulo hexagonal (puertos y adaptadores)

Leé primero `${CLAUDE_PLUGIN_ROOT}/estandares/hexagonal.md`,
`${CLAUDE_PLUGIN_ROOT}/estandares/servicios.md`,
`${CLAUDE_PLUGIN_ROOT}/estandares/errores.md` y
`${CLAUDE_PLUGIN_ROOT}/estandares/trazabilidad.md` (si el repo tiene
`node_modules/@henko-software/agent-rules/estandares/`, manda esa versión).
El modelo vivo es `henko-identity`.

## Dónde va cada cosa

| Capa                 | Qué va                                                  | Qué no puede importar                      |
| -------------------- | ------------------------------------------------------- | ------------------------------------------ |
| `src/domain/`        | entidades, value objects, reglas puras, `defineErrors`  | nada fuera de `domain/` (ni Nest, ni pg)   |
| `src/application/`   | `use-cases/` (uno por operación), `ports/` (interfaces) | adaptadores, Nest, pg, NATS, clientes HTTP |
| `src/adapters/in/`   | controllers HTTP, consumidores de eventos, jobs         | otro adaptador                             |
| `src/adapters/out/`  | postgres (SQL parametrizado), memory (tests), clientes  | otro adaptador                             |
| `src/composition.ts` | qué adaptador va en cada puerto                         | —                                          |

ESLint (`@henko-software/eslint-config/module`) y `henko doctor` cortan las
dependencias que van para afuera. Si el compilador o el lint se quejan, el
problema es el diseño: no se silencia.

## Sumar un caso de uso

1. **Contrato** en `henko-contracts` (request, response, errores, eventos):
   skill `henko:contrato-nuevo`. Sin contrato no hay ruta.
2. **Dominio**: la entidad y sus reglas en TS puro; los errores con las
   claves del contrato (`satisfies Record<XErrorKey, ErrorDefinition>`).
3. **Puerto** en `application/ports/` en idioma de negocio
   (`StockLedger`, no `PgStockTable`).
4. **Caso de uso** en `application/use-cases/x.ts`: `extends UseCase`, con
   `name` estable `<módulo>.<algo>` (es el span y aparece en las trazas),
   puertos por constructor, **una transacción**. Si cambia algo:
   `audit.record` con una acción de `auditActions.ts` (nombre en
   castellano) y, si a otro le interesa, `events.publish` con
   `<módulo>.<entidad>.<hecho>.v1`, ambos dentro de la transacción.
   Permisos con los datos del módulo, nunca con el rol que trae el token.
5. **Adaptadores**: memoria (para tests) y Postgres (SQL parametrizado con
   `SqlExecutor`), más la migración nueva en `migrations/` (nunca editar
   una aplicada).
6. **Cablearlo** en `composition.ts`, `postgresPorts.ts` y
   `src/test/memoryPorts.ts`.
7. **Ruta** en `adapters/in/http/controllers.ts`: `@Inject(USE_CASES)`
   explícito, `parseInput(schemaDelContrato, body)` y la respuesta por el
   DTO del contrato (nunca la fila entera).
8. **Tests**: caso de uso con memoria; integración contra Postgres con
   `HENKO_TEST_DATABASE_URL`; HTTP con supertest si tocó la ruta.
9. `pnpm check && pnpm typecheck && pnpm test && npx @henko-software/cli doctor`.

## Red flags

- Un caso de uso que importa `pg`, `@nestjs/*` o un archivo de `adapters/`.
- Auditoría o evento fuera de la transacción del caso de uso.
- Inyección por tipo sin `@Inject(TOKEN)` (vitest y tsx no emiten metadata).
- Mails, tokens o hashes en los logs.
- Algo que sirve para todos los servicios escrito en un solo repo: va a
  `henko-libs`.
