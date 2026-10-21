# henko-standards

Cómo se trabaja en Henko. Todo lo que es igual en todos los repos vive acá y
llega a cada repo **como paquete**, no copiado: se cambia una vez, se publica
y cada repo lo toma al actualizar la dependencia.

| Paquete                             | Qué trae                                                            | Cómo se usa en un repo                                                 |
| ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `@henko-software/tsconfig`          | `base`, `next`, `react-lib`, `node`                                 | `"extends": "@henko-software/tsconfig/next"`                           |
| `@henko-software/eslint-config`     | `base`, `react`, `next`, `module` (hexagonal)                       | `export default next({ rootDir: 'apps/web' })`                         |
| `@henko-software/prettier-config`   | formato fijo + orden de clases de Tailwind                          | `"prettier": "@henko-software/prettier-config"` en el package.json     |
| `@henko-software/commitlint-config` | conventional commits                                                | `export { default } from '@henko-software/commitlint-config'`          |
| `@henko-software/git-hooks`         | lefthook: lint/format, commitlint, typecheck                        | `extends: [node_modules/@henko-software/git-hooks/lefthook.yml]`       |
| `@henko-software/agent-rules`       | `BASE.md` + [estándares](packages/agent-rules/estandares/README.md) | `@node_modules/@henko-software/agent-rules/BASE.md` en el CLAUDE.md    |
| Workflow `ci-web.yml`               | CI de repos de front                                                | `uses: Henko-Software/henko-standards/.github/workflows/ci-web.yml@v0` |

Los estándares para leer están en
[`packages/agent-rules/estandares/`](packages/agent-rules/estandares/README.md).

## Instalar los paquetes

Se publican en GitHub Packages, que pide un token **incluso para leer**:

1. Crear un token clásico en GitHub → Settings → Developer settings →
   Personal access tokens → Tokens (classic), con el permiso
   `read:packages`.
2. Dejarlo en el perfil de la terminal (`~/.zshrc`):
   `export NODE_AUTH_TOKEN=ghp_...`
3. Cada repo trae un `.npmrc` que lo usa. En CI no hace falta nada: usa el
   `GITHUB_TOKEN`.

## Cambiar un estándar

1. PR acá con el cambio y el `version` del paquete subido (semver: un cambio
   que rompe sube el mayor).
2. `pnpm check` corre los tests de las reglas de ESLint.
3. Al mergear a `main`, `release.yml` publica lo que tenga versión nueva.
4. Cada repo actualiza la dependencia (`pnpm up "@henko-software/*" --latest`).

El workflow reutilizable se usa por el tag `v0`. Para que los repos tomen un
cambio en `ci-web.yml`, se mueve el tag:
`git tag -f v0 && git push -f origin v0`.
