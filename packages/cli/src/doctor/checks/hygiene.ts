import { appendFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Repo, RepoKind } from '../../repo.js'
import { gitignoreEnv, writeRepoFile } from '../../standardFiles.js'
import { type Check, Findings } from '../types.js'

const ENV_FILE = /(^|\/)\.env(\.[\w.-]+)?$/
const isEnvExample = (f: string) => /(^|\/)\.env\.example$/.test(f)

export const envCheck: Check = {
	id: 'env',
	title: 'Variables y secretos (.env)',
	kinds: ['service', 'web', 'lib', 'docs', 'standards'],
	run: repo => {
		const found = new Findings()
		const hasLocalEnv = repo.files.some(
			f => ENV_FILE.test(f) && !isEnvExample(f)
		)
		if (repo.tracked === null) {
			found.warn('no es un repo de git: no puedo ver qué está commiteado')
		} else {
			for (const file of repo.tracked.filter(
				f => ENV_FILE.test(f) && !isEnvExample(f)
			)) {
				found.error(
					`${file} está commiteado: git rm --cached ${file}, rotar lo que tenga y dejar sólo .env.example`
				)
			}
			if (repo.isIgnoredByGit('.env') === false) {
				const report =
					repo.kind === 'docs' && !hasLocalEnv
						? found.warn.bind(found)
						: found.error.bind(found)
				report('.gitignore no ignora .env', {
					description: 'suma .env, .env.* y !.env.example al .gitignore',
					apply: () => {
						const current = repo.read('.gitignore')
						if (current === null) {
							writeRepoFile(repo.root, '.gitignore', gitignoreEnv)
						} else {
							appendFileSync(
								join(repo.root, '.gitignore'),
								`${current.endsWith('\n') ? '' : '\n'}${gitignoreEnv}`
							)
						}
					}
				})
			}
		}
		const needsExample: RepoKind[] = ['service', 'web']
		if (
			(needsExample.includes(repo.kind) || hasLocalEnv) &&
			!repo.files.some(isEnvExample)
		) {
			found.error(
				'falta .env.example con cada variable explicada (sin valores reales)'
			)
		}
		return found.outcome('.env fuera de git y .env.example presente')
	}
}

type Section = { label: string; pattern: RegExp }

const SECTIONS: Record<RepoKind, Section[]> = {
	service: [
		{
			label: 'cómo levantarlo en local',
			pattern: /levant|corr(er|erlo)|en local/i
		},
		{ label: 'Variables', pattern: /variables/i },
		{ label: 'Comandos', pattern: /comandos/i }
	],
	web: [
		{ label: 'cómo levantarlo', pattern: /levant|corr(er|erlo)|en local/i }
	],
	lib: [{ label: 'Publicar', pattern: /publicar|versiones/i }],
	standards: [{ label: 'cómo cambiar un estándar', pattern: /cambiar/i }],
	docs: []
}

export const readmeCheck: Check = {
	id: 'readme',
	title: 'README',
	kinds: ['service', 'web', 'lib', 'docs', 'standards'],
	run: repo => {
		const found = new Findings()
		const content = repo.read('README.md')
		if (content === null) {
			found.error('falta README.md')
			return found.outcome('')
		}
		const lines = content.split('\n')
		const firstHeading = lines.find(l => /^#{1,6}\s/.test(l))
		if (!firstHeading?.startsWith('# ')) {
			found.error('el README no arranca con un título (# nombre)')
		}
		const firstSection = lines.findIndex(l => l.startsWith('## '))
		const intro = lines
			.slice(1, firstSection === -1 ? undefined : firstSection)
			.filter(l => l.trim() && !l.startsWith('#'))
		if (intro.length === 0) {
			found.error(
				'el README no dice qué es el repo (falta el párrafo debajo del título)'
			)
		}
		const headings = lines.filter(l => /^#{2,3}\s/.test(l))
		for (const section of SECTIONS[repo.kind]) {
			if (!headings.some(h => section.pattern.test(h))) {
				found.error(`al README le falta la sección «${section.label}»`)
			}
		}
		return found.outcome('título, qué es y las secciones mínimas')
	}
}

/** Lo que viene de los paquetes y no se copia en un repo. */
export const localCopies = (repo: Repo): string[] => {
	const problems: string[] = []
	for (const file of repo.files) {
		const name = file.split('/').pop() ?? ''
		if (name === 'BASE.md' || /(^|\/)estandares\/.+\.md$/.test(file)) {
			problems.push(
				`${file}: copia de las reglas; se importan de @henko-software/agent-rules`
			)
		} else if (
			/^\.lintstagedrc/.test(name) ||
			name === 'lint-staged.config.js'
		) {
			problems.push(
				`${file}: lint-staged no se usa, los hooks salen de @henko-software/git-hooks`
			)
		} else if (file.endsWith('.md') && file !== 'CLAUDE.md') {
			const content = repo.read(file) ?? ''
			if (/^# Reglas base de Henko/m.test(content)) {
				problems.push(`${file}: tiene las reglas base copiadas`)
			}
		}
	}
	if (repo.pkg?.['lint-staged'] !== undefined) {
		problems.push(
			'package.json tiene "lint-staged": los hooks salen de @henko-software/git-hooks'
		)
	}
	return problems
}

export const copiesCheck: Check = {
	id: 'copias',
	title: 'Sin copias locales de los estándares',
	kinds: ['service', 'web', 'lib', 'docs'],
	run: repo => {
		const found = new Findings()
		for (const problem of localCopies(repo)) found.error(problem)
		return found.outcome('nada copiado: todo sale de los paquetes')
	}
}
