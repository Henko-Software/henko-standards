# henko-__name__

Módulo __name__ de Henko. Servicio NestJS 12 (ESM) con arquitectura
hexagonal, armado con `henko new service` a partir de la forma de
`henko-identity`. Ver el README para la API, variables y cómo levantarlo.

Las reglas generales están en `@henko-software/agent-rules` (las importa el
`CLAUDE.md`). Acá va sólo lo propio.

## Capas

```
src/domain/          entidades y errores (defineErrors con las claves del contrato)
src/application/     ports/ (repos y servicios que necesita), use-cases/, auditActions
src/adapters/in/http controllers Nest, DTOs (siempre por el schema del contrato), createApp
src/adapters/out/    postgres/ (SQL parametrizado), memory/ (tests), nats/
src/composition.ts   qué adaptador va en cada puerto
src/postgresPorts.ts los puertos de producción
src/server.ts        arranque; src/main.ts sólo carga OpenTelemetry primero
```

ESLint (`@henko-software/eslint-config/module`) corta las dependencias que
van para afuera; `henko doctor` lo vuelve a mirar en el CI.

## Sumar un caso de uso

1. Contrato primero en `henko-contracts` (`packages/contracts-__name__`:
   request, response, errores, eventos).
2. `src/application/use-cases/x.ts` que `extends UseCase`, con `name`
   `__name__.<algo>`; puertos por constructor.
3. Acción de auditoría en `auditActions.ts` si cambia algo.
4. Cablearlo en `composition.ts` y en `__Name__UseCases`.
5. Ruta en `adapters/in/http/controllers.ts` con `parseInput` y DTO del contrato.
6. Test con memoria en `src/test/` y, si toca HTTP, en `http.test.ts`.

La skill `henko:modulo-hexagonal` (plugin de Henko) tiene el paso a paso.
