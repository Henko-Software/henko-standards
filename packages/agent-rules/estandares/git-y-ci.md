# Git, PRs y CI

## Git

- Todo entra por **PR a `main`** con el CI en verde.
- `git pull --rebase` antes de pushear.
- **Conventional commits** con scope opcional: `feat(contactos): alta`.
  commitlint lo exige.
- Prohibido `--no-verify` y prohibido debilitar hooks o configs.
- Nunca secretos, `.env`, dumps ni datos reales.

## Hooks (lefthook, desde `@henko-software/git-hooks`)

| Hook         | Qué corre                                 |
| ------------ | ----------------------------------------- |
| `pre-commit` | ESLint `--fix` y Prettier sobre lo staged |
| `commit-msg` | commitlint                                |
| `pre-push`   | `pnpm typecheck`                          |

## CI

Cada repo tiene un `.github/workflows/ci.yml` corto que llama al workflow
reutilizable de `henko-standards` por el tag `@v0`: `ci-web.yml` para el
front, `ci-lib.yml` para librerías y servicios (`postgres: true` si tiene
tests de integración). Corre: secretos (gitleaks), formato, lint, typecheck,
build y tests.

Con `doctor: true` corre además **`henko doctor`** (`@henko-software/cli`):
falla si el repo se desvía del estándar (configs copiadas en vez de
importadas, CLAUDE.md sin agent-rules, hooks o commitlint sin configurar, CI
fuera de `@v0`, paquetes `@henko-software/*` atrasados, capas hexagonales
rotas, `.env` commiteado, README sin las secciones mínimas). Antes de pushear
se puede correr a mano: `npx @henko-software/cli doctor`.

## Dependencias (Renovate)

Cada repo tiene un `renovate.json` que sólo extiende
`github>Henko-Software/henko-standards:renovate-config`. Los
`@henko-software/*` llegan en un PR agrupado apenas se publican (también los
minors de 0.x, que rompen y se revisan); los parches se mergean solos con el
CI en verde. No se suben a mano repo por repo.

## Servicio nuevo

Sale de `npx @henko-software/cli new service <nombre> --port <puerto>`, no de
copiar otro repo ni de un template repo. La skill `henko:servicio-nuevo` del
plugin de Henko tiene el paso a paso.

## PRs

- Descripción con qué cambia y por qué.
- Capturas a 375px y desktop si toca pantallas.
- Un PR, un tema.
