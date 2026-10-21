# Servicios (módulos, orquestador, BFF)

Todo servicio del back se arma con el chasis de `henko-libs`. Lo que sigue
es lo que no se negocia; el cómo, con ejemplos, está en el README de
`henko-libs`. Servicios de referencia: `henko-identity` (módulo) y
`henko-bff`.

## Stack

NestJS 12 (ESM) · TypeScript estricto · Postgres 16 con SQL parametrizado
(`SqlExecutor`) · NATS JetStream · zod · vitest + supertest.

Inyección **siempre con `@Inject(TOKEN)` explícito**: vitest y tsx compilan
con esbuild, que no emite la metadata de tipos de los decoradores.

## Arranque (`main.ts`)

1. `import './instrumentation.js'` primero: `initTracing` antes de cargar
   Nest, pg o http.
2. Env validado con zod; cada secreto como archivo (`X_FILE`) y `X` sólo en
   desarrollo.
3. `createContextMiddleware` (default-deny, rutas públicas explícitas),
   `HenkoErrorFilter`, `createLogger`.
4. `GET /health` público, que chequea lo que el servicio necesita.

## Entre servicios

- Cada llamada lleva un **token interno** (`@henko-software/service-auth`):
  Ed25519, 60 s, emisor y audiencia. Adentro viaja el contexto (actor con
  su rol, local, correlación). Nunca cabeceras sueltas tipo `x-user-id`.
- Cada servicio tiene su par de claves. La privada, como secreto del que
  firma; la pública, en la config de los que confían en él.
- Los permisos los decide el dueño del dato (identity decide quién crea
  usuarios), no el que llama.
- Un error remoto se propaga con su misma clave y mensaje.

## Datos

- Una base por servicio; nadie lee la base de otro.
- Roles de Postgres: `<svc>_owner` sólo para migraciones, `<svc>_app` en
  runtime (sin DDL), `<svc>_ro` para lectura.
- Migraciones `.sql` numeradas en `migrations/`, con `runMigrations`. Nunca
  se edita una aplicada (el checksum lo frena).
- Auditoría (`PgAuditTrail`) y eventos (`PgOutboxPublisher`) dentro de la
  transacción del caso de uso. La tabla de auditoría sin UPDATE/DELETE para
  `<svc>_app`.

## Casos de uso

`extends UseCase`, con `name` estable (`identity.login`): una transacción y
un span con nombre. Lo que cambia algo se audita con una acción del catálogo
(`defineAuditActions`, con nombre en español) y, si a otro le interesa, sale
como evento (`<módulo>.<entidad>.<hecho>.v1`).

## Tests

- Casos de uso con adaptadores en memoria (`@henko-software/testing`).
- Integración contra Postgres real con `HENKO_TEST_DATABASE_URL` (el CI la
  pone con `postgres: true`).
- Un e2e HTTP por servicio con supertest, con claves generadas en el test.
