import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Los archivos de una línea que cada repo tiene para apuntar a los paquetes.
 * `henko doctor --fix` los crea cuando faltan y `henko new service` los usa.
 */
export const SCOPE = '@henko-software'
export const STANDARDS_REPO = 'Henko-Software/henko-standards'
export const WORKFLOW_TAG = 'v0'

export const AGENT_RULES_IMPORT = `@node_modules/${SCOPE}/agent-rules/BASE.md`
export const GIT_HOOKS_EXTENDS = `node_modules/${SCOPE}/git-hooks/lefthook.yml`

export const MARKETPLACE_NAME = 'henko-software'
export const PLUGIN_ID = `henko@${MARKETPLACE_NAME}`

export const claudeMd = `<!-- Reglas de Henko (paquete ${SCOPE}/agent-rules) + lo propio del repo. -->

${AGENT_RULES_IMPORT}
@AGENTS.md
`

export const lefthookYml = `extends:
  - ${GIT_HOOKS_EXTENDS}
`

export const commitlintConfig = `export { default } from '${SCOPE}/commitlint-config'
`

export const npmrc = `${SCOPE}:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}
`

export const gitignoreEnv = `.env
.env.*
!.env.example
`

export const ciYml = (
	workflow: 'ci-web' | 'ci-lib',
	options: { postgres: boolean }
): string => {
	const withLines = [
		...(options.postgres ? ['      postgres: true'] : []),
		'      doctor: true'
	]
	return `name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  packages: read

jobs:
  ci:
    uses: ${STANDARDS_REPO}/.github/workflows/${workflow}.yml@${WORKFLOW_TAG}
    with:
${withLines.join('\n')}
`
}

/** El plugin de Claude Code con las skills de Henko, para todo el repo. */
export const claudeSettings = {
	extraKnownMarketplaces: {
		[MARKETPLACE_NAME]: {
			source: { source: 'github', repo: STANDARDS_REPO }
		}
	},
	enabledPlugins: { [PLUGIN_ID]: true }
}

export const writeRepoFile = (
	root: string,
	rel: string,
	content: string
): void => {
	const path = join(root, rel)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, content)
}
