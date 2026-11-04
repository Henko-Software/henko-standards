# henko-standards

Cómo se trabaja en Henko. Todo lo que es igual en todos los repos vive acá y
llega a cada repo **como paquete**, no copiado: se cambia una vez, se publica
y cada repo lo toma al actualizar la dependencia.

| Paquete                             | Qué trae                                                               | Cómo se usa en un repo                                                 |
| ----------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `@henko-software/tsconfig`          | `base`, `next`, `react-lib`, `node`                                    | `"extends": "@henko-software/tsconfig/next"`                           |
| `@henko-software/eslint-config`     | `base`, `react`, `next`, `module` (hexagonal)                          | `export default next({ rootDir: 'apps/web' })`                         |
| `@henko-software/prettier-config`   | formato fijo + orden de clases de Tailwind                             | `"prettier": "@henko-software/prettier-config"` en el package.json     |
| `@henko-software/commitlint-config` | conventional commits                                                   | `export { default } from '@henko-software/commitlint-config'`          |
| `@henko-software/git-hooks`         | lefthook: lint/format, commitlint, typecheck                           | `extends: [node_modules/@henko-software/git-hooks/lefthook.yml]`       |
| `@henko-software/agent-rules`       | `BASE.md` + [estándares](packages/agent-rules/estandares/README.md)    | `@node_modules/@henko-software/agent-rules/BASE.md` en el CLAUDE.md    |
| `@henko-software/cli`               | `henko doctor` (¿el repo cumple?) y `henko new service`                | `npx @henko-software/cli doctor` ([README](packages/cli/README.md))    |
| Workflow `ci-web.yml`               | CI de repos de front                                                   | `uses: Henko-Software/henko-standards/.github/workflows/ci-web.yml@v0` |
| Workflow `ci-lib.yml`               | CI de librerías y servicios Node                                       | `uses: Henko-Software/henko-standards/.github/workflows/ci-lib.yml@v0` |
| Preset de Renovate                  | sube los `@henko-software/*` en un PR agrupado, parches solos          | `"extends": ["github>Henko-Software/henko-standards:renovate-config"]` |
| Plugin de Claude Code `henko`       | skills: servicio nuevo, módulo hexagonal, contrato nuevo, review front | `.claude/settings.json` (ver abajo)                                    |

Los estándares para leer están en
[`packages/agent-rules/estandares/`](packages/agent-rules/estandares/README.md).

**Nada se copia por repo.** Un repo de Henko tiene archivos de una línea
que apuntan a los paquetes, un `ci.yml` que llama al workflow reutilizable
y un `renovate.json` que extiende el preset. `henko doctor` corre en el CI y
falla si algo se desvía; un servicio nuevo sale de `henko new service`, no
de un template repo.

## Instalar los paquetes

Se publican en GitHub Packages, que pide un token **incluso para leer**:

1. Crear un token clásico en GitHub → Settings → Developer settings →
   Personal access tokens → Tokens (classic), con el permiso
   `read:packages`.
2. Dejarlo en el perfil de la terminal (`~/.zshrc`):
   `export NODE_AUTH_TOKEN=ghp_...`
3. Cada repo trae un `.npmrc` que lo usa. En CI no hace falta nada: usa el
   `GITHUB_TOKEN`.

## henko doctor en el CI

Los workflows reutilizables lo corren en un job aparte cuando el `ci.yml` del
repo lo pide (se prende de a un repo):

```yaml
jobs:
  ci:
    uses: Henko-Software/henko-standards/.github/workflows/ci-lib.yml@v0
    with:
      postgres: true
      doctor: true
```

Para ver qué le falta a un repo antes de prenderlo:
`npx @henko-software/cli doctor` (y `--fix` para lo que se crea solo).

## Renovate

El preset es [`renovate-config.json`](renovate-config.json): los
`@henko-software/*` van juntos en un PR («paquetes de Henko») apenas se
publican, incluso los minors de 0.x que el `^` no toma solo; los parches se
mergean solos si el CI pasa; lo de terceros, de lunes a viernes de 6 a 9
(hora de Argentina), con los minors agrupados los lunes. Cada repo tiene sólo:

```json
{
	"$schema": "https://docs.renovatebot.com/renovate-schema.json",
	"extends": ["github>Henko-Software/henko-standards:renovate-config"]
}
```

**Instalar la app en la org (una vez, con permiso de dueño de la org):**

1. Entrar a <https://github.com/apps/renovate> → **Install** → elegir
   `Henko-Software` → **All repositories** (o los repos con package.json).
2. En <https://developer.mend.io> entrar con GitHub, elegir la org y dejar
   el modo **Silent** apagado (que abra PRs).
3. Renovate lee GitHub Packages con el token de la app (lo provisiona solo
   para `npm.pkg.github.com`). Si los `@henko-software/*` aparecen como «no
   encontrados» en el Dependency Dashboard: crear un token clásico con
   `read:packages`, guardarlo en developer.mend.io → la org → **Credentials**
   como `HENKO_PACKAGES_TOKEN` y sumar
   `"hostRules": [{ "matchHost": "npm.pkg.github.com", "hostType": "npm", "token": "{{ secrets.HENKO_PACKAGES_TOKEN }}" }]`
   en un preset **privado** de la org (un secreto no va en este preset
   público) que cada repo extienda junto con este.
4. El primer PR de cada repo es «Configure Renovate»: si el repo ya tiene
   `renovate.json`, se saltea.

## Skills de Henko (plugin de Claude Code)

El marketplace `henko-software` es este repo
([`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)) y el
plugin `henko` vive en [`plugins/henko/`](plugins/henko/). Las skills leen
los estándares de `packages/agent-rules/estandares/` (el plugin los trae por
symlink, así que no hay una segunda copia):

| Skill                    | Para qué                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `henko:servicio-nuevo`   | un módulo nuevo con `henko new service`, infra y CI           |
| `henko:modulo-hexagonal` | casos de uso, puertos y adaptadores en un servicio            |
| `henko:contrato-nuevo`   | rutas, errores y eventos en `henko-contracts`, con versionado |
| `henko:review-front`     | revisar un PR de `henko-web` contra los estándares del front  |

Cada repo lo habilita en `.claude/settings.json` (lo crea
`henko doctor --fix`); Claude Code lo ofrece al confiar en la carpeta:

```json
{
	"extraKnownMarketplaces": {
		"henko-software": {
			"source": { "source": "github", "repo": "Henko-Software/henko-standards" }
		}
	},
	"enabledPlugins": { "henko@henko-software": true }
}
```

A mano: `/plugin marketplace add Henko-Software/henko-standards` y
`/plugin install henko@henko-software`. El plugin no fija `version`: cada
commit a `main` es una versión nueva (`/plugin marketplace update
henko-software`, o auto-update prendido en `/plugin` → Marketplaces).
Para probar cambios: `claude plugin validate .` y
`claude --plugin-dir ./plugins/henko`.

## Cambiar un estándar

1. PR acá con el cambio y el `version` del paquete subido (semver: un cambio
   que rompe sube el mayor).
2. `pnpm check` corre los tests de las reglas de ESLint.
3. Al mergear a `main`, `release.yml` publica lo que tenga versión nueva.
4. Cada repo actualiza la dependencia (`pnpm up "@henko-software/*" --latest`).

Los workflows reutilizables se usan por el tag `v0`. Para que los repos
tomen un cambio en `ci-web.yml` o `ci-lib.yml`, se mueve el tag:
`git tag -f v0 && git push -f origin v0`. Un cambio que rompe a los repos
(un input obligatorio nuevo) va en un tag `v1` nuevo, no moviendo `v0`.

Si el cambio es del CLI, subir también el rango por defecto de
`doctor-version` en los workflows cuando el CLI salte de minor.
