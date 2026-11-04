import { allDeps, type Repo } from '../../repo.js'
import {
	commitlintConfig,
	GIT_HOOKS_EXTENDS,
	lefthookYml,
	npmrc,
	SCOPE,
	writeRepoFile
} from '../../standardFiles.js'
import { type Check, Findings } from '../types.js'
import { updatePackageJson } from './packageJson.js'

const JS_REPOS = ['service', 'web', 'lib', 'standards'] as const
const CONSUMERS = ['service', 'web', 'lib'] as const

const rootDeps = (repo: Repo) => (repo.pkg ? allDeps(repo.pkg) : {})

const requireDevDeps = (repo: Repo, found: Findings, names: string[]) => {
	const deps = rootDeps(repo)
	const missing = names.filter(n => !(n in deps))
	if (missing.length > 0) {
		found.error(
			`faltan en el package.json de la raíz: ${missing.join(', ')} (pnpm add -D ${missing.join(' ')})`
		)
	}
}

/** Archivos que nunca tienen que aparecer: copias de configs que salen del paquete. */
const forbiddenConfigs = (repo: Repo, pattern: RegExp) =>
	repo.files.filter(f => pattern.test(f.split('/').pop() ?? ''))

export const eslintCheck: Check = {
	id: 'eslint',
	title: 'ESLint',
	kinds: JS_REPOS,
	run: repo => {
		const found = new Findings()
		const configs = repo.files.filter(f =>
			/(^|\/)eslint\.config\.(js|mjs|cjs|ts)$/.test(f)
		)
		const root = configs.find(f => !f.includes('/'))
		if (!root) {
			found.error(
				`falta eslint.config.js en la raíz (export { default } from '${SCOPE}/eslint-config/<variante>')`,
				repo.kind === 'service'
					? {
							description: 'crea eslint.config.js con la variante module',
							apply: () =>
								writeRepoFile(
									repo.root,
									'eslint.config.js',
									`export { default } from '${SCOPE}/eslint-config/module'\n`
								)
						}
					: undefined
			)
		}
		for (const file of configs) {
			const content = repo.read(file) ?? ''
			const usesPackage =
				content.includes(`${SCOPE}/eslint-config`) ||
				(repo.kind === 'standards' &&
					content.includes('packages/eslint-config'))
			if (!usesPackage) {
				found.error(
					`${file} no usa ${SCOPE}/eslint-config: es una config local`
				)
			}
		}
		if (
			repo.kind === 'service' &&
			root &&
			!(repo.read(root) ?? '').includes(`${SCOPE}/eslint-config/module`)
		) {
			found.error(
				`${root} tiene que usar la variante module (capas hexagonales): ${SCOPE}/eslint-config/module`
			)
		}
		for (const legacy of forbiddenConfigs(repo, /^\.eslintrc(\..+)?$/)) {
			found.error(`${legacy}: config vieja de ESLint, se borra`)
		}
		if (repo.kind !== 'standards') {
			requireDevDeps(repo, found, ['eslint', `${SCOPE}/eslint-config`])
		}
		return found.outcome(`usa ${SCOPE}/eslint-config`)
	}
}

export const prettierCheck: Check = {
	id: 'prettier',
	title: 'Prettier',
	kinds: JS_REPOS,
	run: repo => {
		const found = new Findings()
		const expected = `${SCOPE}/prettier-config`
		const current = repo.pkg?.prettier
		if (current === undefined) {
			found.error(`falta "prettier": "${expected}" en el package.json`, {
				description: `suma "prettier": "${expected}" al package.json`,
				apply: () =>
					updatePackageJson(repo.root, pkg => ({ ...pkg, prettier: expected }))
			})
		} else if (current !== expected) {
			found.error(
				`el package.json define su propio Prettier; tiene que ser "prettier": "${expected}"`
			)
		}
		for (const copy of forbiddenConfigs(
			repo,
			/^(\.prettierrc(\..+)?|prettier\.config\.(js|mjs|cjs|ts))$/
		)) {
			found.error(
				`${copy}: config local de Prettier, se borra (manda el paquete)`
			)
		}
		if (repo.kind !== 'standards') {
			requireDevDeps(repo, found, ['prettier', expected])
		}
		return found.outcome(`usa ${expected}`)
	}
}

/** Lee el `extends` de un tsconfig (acepta comentarios, como tsc). */
const tsconfigExtends = (content: string): string[] => {
	const match = /"extends"\s*:\s*(\[[^\]]*\]|"[^"]*")/.exec(content)
	if (!match?.[1]) return []
	return [...match[1].matchAll(/"([^"]+)"/g)].map(m => m[1] ?? '')
}

const WEAKENED = [
	'strict',
	'noImplicitAny',
	'strictNullChecks',
	'noUncheckedIndexedAccess',
	'noUnusedLocals',
	'noUnusedParameters',
	'noImplicitOverride'
]

export const tsconfigCheck: Check = {
	id: 'tsconfig',
	title: 'tsconfig',
	kinds: ['service', 'web', 'lib'],
	run: repo => {
		const found = new Findings()
		const configs = repo.files.filter(f =>
			/(^|\/)tsconfig(\.[\w-]+)?\.json$/.test(f)
		)
		if (configs.length === 0) {
			found.error('no hay tsconfig.json')
			return found.outcome('')
		}
		const rootConfigs = configs.filter(f => !f.includes('/'))
		const rootUsesPackage = rootConfigs.some(f =>
			tsconfigExtends(repo.read(f) ?? '').some(e =>
				e.startsWith(`${SCOPE}/tsconfig`)
			)
		)
		const anyUsesPackage = configs.some(f =>
			tsconfigExtends(repo.read(f) ?? '').some(e =>
				e.startsWith(`${SCOPE}/tsconfig`)
			)
		)
		if (!anyUsesPackage) {
			found.error(`ningún tsconfig extiende ${SCOPE}/tsconfig`)
		} else if (rootConfigs.length > 0 && !rootUsesPackage) {
			found.warn(
				`los tsconfig de la raíz no extienden ${SCOPE}/tsconfig (sí algunos de los paquetes)`
			)
		}
		for (const file of configs) {
			const content = repo.read(file) ?? ''
			if (tsconfigExtends(content).length === 0) {
				found.error(
					`${file} no extiende nada: tiene que salir de ${SCOPE}/tsconfig`
				)
			}
			for (const flag of WEAKENED) {
				if (new RegExp(`"${flag}"\\s*:\\s*false`).test(content)) {
					found.error(`${file} apaga ${flag}: no se debilita el compilador`)
				}
			}
		}
		requireDevDeps(repo, found, [`${SCOPE}/tsconfig`])
		return found.outcome(`extiende ${SCOPE}/tsconfig, estricto`)
	}
}

const normalize = (s: string) =>
	s.replace(/;\s*$/gm, '').replace(/\s+/g, ' ').trim()

export const commitlintCheck: Check = {
	id: 'commitlint',
	title: 'commitlint',
	kinds: JS_REPOS,
	run: repo => {
		const found = new Findings()
		const file = repo.files.find(f =>
			/^commitlint\.config\.(js|mjs|cjs|ts)$/.test(f)
		)
		if (!file) {
			found.error('falta commitlint.config.js', {
				description: 'crea commitlint.config.js',
				apply: () =>
					writeRepoFile(repo.root, 'commitlint.config.js', commitlintConfig)
			})
		} else {
			const content = repo.read(file) ?? ''
			if (normalize(content) !== normalize(commitlintConfig)) {
				if (content.includes(`${SCOPE}/commitlint-config`)) {
					found.warn(
						`${file} suma reglas propias sobre ${SCOPE}/commitlint-config; si sirven para todos, van al paquete`
					)
				} else {
					found.error(`${file} no usa ${SCOPE}/commitlint-config`)
				}
			}
		}
		for (const copy of forbiddenConfigs(repo, /^\.commitlintrc(\..+)?$/)) {
			found.error(`${copy}: config local de commitlint, se borra`)
		}
		requireDevDeps(repo, found, [
			'@commitlint/cli',
			`${SCOPE}/commitlint-config`
		])
		return found.outcome(`re-exporta ${SCOPE}/commitlint-config`)
	}
}

export const lefthookCheck: Check = {
	id: 'lefthook',
	title: 'Hooks de git (lefthook)',
	kinds: JS_REPOS,
	run: repo => {
		const found = new Findings()
		const file = ['lefthook.yml', 'lefthook.yaml', '.lefthook.yml'].find(f =>
			repo.exists(f)
		)
		const expected =
			repo.kind === 'standards'
				? 'packages/git-hooks/lefthook.yml'
				: GIT_HOOKS_EXTENDS
		if (!file) {
			found.error('falta lefthook.yml', {
				description: 'crea lefthook.yml',
				apply: () => writeRepoFile(repo.root, 'lefthook.yml', lefthookYml)
			})
		} else {
			const content = repo.read(file) ?? ''
			if (!content.includes(expected)) {
				found.error(`${file} no extiende ${expected}`)
			}
			const ownHooks = content
				.split('\n')
				.filter(l => /^[a-z-]+:/.test(l) && !l.startsWith('extends:'))
			if (ownHooks.length > 0) {
				found.warn(
					`${file} define hooks propios (${ownHooks.map(l => l.replace(':', '').trim()).join(', ')}); si sirven para todos, van a ${SCOPE}/git-hooks`
				)
			}
		}
		if (repo.files.some(f => f.startsWith('.husky/'))) {
			found.error('.husky/: los hooks salen de lefthook, se borra')
		}
		const prepare = repo.pkg?.scripts?.prepare
		if (!prepare?.includes('lefthook install')) {
			found.error(
				'el package.json no instala los hooks: falta "prepare": "lefthook install"',
				prepare === undefined
					? {
							description: 'suma "prepare": "lefthook install" al package.json',
							apply: () =>
								updatePackageJson(repo.root, pkg => ({
									...pkg,
									scripts: { ...pkg.scripts, prepare: 'lefthook install' }
								}))
						}
					: undefined
			)
		}
		if (repo.kind !== 'standards') {
			requireDevDeps(repo, found, ['lefthook', `${SCOPE}/git-hooks`])
		}
		return found.outcome(`extiende ${SCOPE}/git-hooks`)
	}
}

export const npmrcCheck: Check = {
	id: 'npmrc',
	title: 'Registro de paquetes (.npmrc)',
	kinds: JS_REPOS,
	run: repo => {
		const found = new Findings()
		const content = repo.read('.npmrc')
		if (content === null) {
			found.error('falta .npmrc con el registro de GitHub Packages', {
				description: 'crea .npmrc',
				apply: () => writeRepoFile(repo.root, '.npmrc', npmrc)
			})
			return found.outcome('')
		}
		if (!content.includes(`${SCOPE}:registry=https://npm.pkg.github.com`)) {
			found.error(`.npmrc no apunta ${SCOPE} a https://npm.pkg.github.com`)
		}
		const token = /_authToken=(.*)$/m.exec(content)?.[1]?.trim()
		if (token && token !== '${NODE_AUTH_TOKEN}') {
			found.error(
				'.npmrc tiene un token escrito: se saca ya, se rota y se usa ${NODE_AUTH_TOKEN}'
			)
		} else if (!token) {
			found.error(
				'.npmrc no pasa el token: falta _authToken=${NODE_AUTH_TOKEN}'
			)
		}
		return found.outcome('GitHub Packages con ${NODE_AUTH_TOKEN}')
	}
}

export { CONSUMERS }
