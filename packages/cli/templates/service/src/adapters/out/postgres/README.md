# Adaptadores de Postgres

Repositorios con SQL parametrizado sobre `SqlExecutor` (`@henko-software/pg`),
uno por puerto de `application/ports`. Toman el executor de la transacción
del caso de uso: `new PgXRepository(executor)` en `postgresPorts.ts`.
