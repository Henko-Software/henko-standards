# @henko-software/cli

El comando `henko`: mantiene los repos de Henko alineados con el estándar sin
copiar nada en cada uno.

```bash
npx @henko-software/cli doctor            # ¿este repo cumple?
npx @henko-software/cli doctor --fix      # crea lo que falta, sin pisar nada
npx @henko-software/cli new service stock --port 3202
```

Necesita `NODE_AUTH_TOKEN` con `read:packages` (ver el README de
`henko-standards`).

## `henko doctor`

Lee el repo (no instala ni compila) y dice, en castellano, qué se desvía del
estándar. Sale con código 1 si hay alguna **falla**; los **avisos** no
cortan el CI. En GitHub Actions deja cada problema como anotación del run.

| Chequeo      | Qué mira                                                                                                    | `--fix`                              |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `agentes`    | `CLAUDE.md` importa `@node_modules/@henko-software/agent-rules/BASE.md` y `@AGENTS.md`; existe `AGENTS.md`  | crea `CLAUDE.md` o le suma el import |
| `eslint`     | toda config de ESLint sale de `@henko-software/eslint-config` (servicios: `module`); nada de `.eslintrc`    | crea la de un servicio               |
| `prettier`   | `"prettier": "@henko-software/prettier-config"`; nada de `.prettierrc`                                      | suma la clave al package.json        |
| `tsconfig`   | todo tsconfig extiende algo y la cadena llega a `@henko-software/tsconfig`; nadie apaga `strict` y compañía | —                                    |
| `commitlint` | `commitlint.config.js` de una línea                                                                         | lo crea                              |
| `lefthook`   | `lefthook.yml` extiende `@henko-software/git-hooks`; `prepare: lefthook install`; nada de `.husky/`         | crea el archivo y el script          |
| `npmrc`      | `.npmrc` con GitHub Packages y `${NODE_AUTH_TOKEN}` (nunca un token escrito)                                | lo crea                              |
| `ci`         | el CI llama a `ci-web.yml` / `ci-lib.yml` **@v0** y tiene `doctor: true`                                    | crea `ci.yml` si no hay              |
| `renovate`   | `renovate.json` extiende `github>Henko-Software/henko-standards:renovate-config` (aviso si falta)           | lo crea                              |
| `versiones`  | ningún `@henko-software/*` atrasado más de `--max-lag` versiones que rompen (en 0.x, el minor)              | — (lo sube Renovate)                 |
| `hexagonal`  | servicios con `src/application` y `src/adapters`; domain y application sin adaptadores ni infraestructura   | —                                    |
| `env`        | ningún `.env` commiteado, `.env` en el `.gitignore`, `.env.example` en servicios y front                    | suma `.env` al `.gitignore`          |
| `readme`     | título, qué es y las secciones mínimas según el tipo de repo                                                | —                                    |
| `copias`     | nada de `BASE.md`, `estandares/`, lint-staged ni reglas copiadas                                            | —                                    |
| `plugin`     | `.claude/settings.json` habilita `henko@henko-software` (skills de Henko)                                   | suma el marketplace y el plugin      |

El tipo de repo (servicio, front, librerías, documentación) sale solo; se
puede forzar con `"henko": { "kind": "service" }` en el package.json. Un
chequeo se puede saltear **con el motivo escrito**:

```json
"henko": { "doctor": { "ignore": { "readme": "repo de prueba" }, "maxLag": 1 } }
```

Las versiones publicadas salen de GitHub Packages (con `NODE_AUTH_TOKEN`) o,
si el token no alcanza, del `package.json` en `main` de los repos públicos.

## `henko new service <nombre> --port <puerto>`

Arma `henko-<nombre>` con la forma de `henko-identity`: capas, composición,
env validado con zod, OpenTelemetry primero, `/health` pública y el resto con
token interno, auditoría y outbox en la migración `0001`, NATS, tests (HTTP
sin base y migraciones con Postgres) y CI con `doctor: true`. Reemplaza al
template repo: la plantilla (`templates/service/`) se versiona con el
paquete. Al terminar imprime los pasos que siguen (contrato, henko-infra,
repo en la org).
