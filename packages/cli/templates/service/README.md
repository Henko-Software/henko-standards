# henko-__name__

Módulo de Henko dueño de **(completar: qué datos y qué reglas son de este
módulo)**. Lo llaman el BFF (y después el orquestador) por su API interna;
nadie más lee su base.

- Contrato: `@henko-software/contracts-__name__` en
  [`henko-contracts`](https://github.com/Henko-Software/henko-contracts).
- Chasis: [`henko-libs`](https://github.com/Henko-Software/henko-libs).
- Arquitectura hexagonal: `src/domain` → `src/application` → `src/adapters`.

## API interna

Toda llamada lleva `Authorization: Bearer <token interno>` firmado por un
servicio confiable (hoy, el BFF) con audiencia `__name__`. Sin token válido
responde 401. Sólo `/health` es pública.

| Ruta          | Qué hace         | Quién   |
| ------------- | ---------------- | ------- |
| `GET /health` | `{ status, db }` | pública |

## Levantarlo en local

Requisitos: Node 22, pnpm 9, `NODE_AUTH_TOKEN` con `read:packages` y el
entorno de [`henko-infra`](https://github.com/Henko-Software/henko-infra)
levantado, con `__name__` en `HENKO_SERVICES` (base `__name__` y sus roles).

```bash
pnpm install
cp .env.example .env          # completar BFF_PUBLIC_KEY_PEM
pnpm migrate                  # con __name___owner
pnpm dev                      # http://localhost:__port__/health
```

## Variables

Todas están explicadas en [`.env.example`](.env.example). Los secretos
(`DATABASE_URL`, `MIGRATIONS_DATABASE_URL`, `BFF_PUBLIC_KEY_PEM`) van como
archivo en un servidor (`X_FILE`).

## Eventos que publica

Ninguno todavía. Cada evento sale por el outbox como
`__name__.<entidad>.<hecho>.v1` y se documenta acá y en el contrato.

## Comandos

| Comando          | Qué hace                                               |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | levanta el servicio con recarga                        |
| `pnpm migrate`   | aplica las migraciones de `migrations/`                |
| `pnpm test`      | tests (los de Postgres, con `HENKO_TEST_DATABASE_URL`) |
| `pnpm check`     | formato + lint                                         |
| `pnpm typecheck` | tipos                                                  |
| `henko doctor`   | ¿cumple el estándar de Henko?                          |
