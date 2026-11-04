import type { Repo } from '../../repo.js'
import {
	ciYml,
	STANDARDS_REPO,
	WORKFLOW_TAG,
	writeRepoFile
} from '../../standardFiles.js'
import { type Check, Findings } from '../types.js'

const REUSABLE = new RegExp(
	`uses:\\s*${STANDARDS_REPO.replace('/', '\\/')}\\/\\.github\\/workflows\\/(ci-[a-z]+)\\.yml@([\\w.-]+)`,
	'g'
)

const expectedWorkflow = (repo: Repo): 'ci-web' | 'ci-lib' =>
	repo.kind === 'web' ? 'ci-web' : 'ci-lib'

const needsPostgres = (repo: Repo) =>
	repo.files.some(f => /(^|\/)migrations\/.+\.sql$/.test(f)) ||
	repo.files.some(
		f =>
			/\.(ts|js|mjs)$/.test(f) &&
			(repo.read(f) ?? '').includes('HENKO_TEST_DATABASE_URL')
	)

export const ciCheck: Check = {
	id: 'ci',
	title: 'CI (workflows reutilizables)',
	kinds: ['service', 'web', 'lib'],
	run: repo => {
		const found = new Findings()
		const workflows = repo.files.filter(f =>
			/^\.github\/workflows\/[^/]+\.ya?ml$/.test(f)
		)
		const expected = expectedWorkflow(repo)
		const uses = workflows.flatMap(file =>
			[...(repo.read(file) ?? '').matchAll(REUSABLE)].map(m => ({
				file,
				workflow: m[1] ?? '',
				ref: m[2] ?? ''
			}))
		)
		if (uses.length === 0) {
			const create = !repo.exists('.github/workflows/ci.yml')
			found.error(
				`ningún workflow llama a ${STANDARDS_REPO}/.github/workflows/${expected}.yml@${WORKFLOW_TAG}`,
				create
					? {
							description: `crea .github/workflows/ci.yml con ${expected}.yml@${WORKFLOW_TAG}`,
							apply: () =>
								writeRepoFile(
									repo.root,
									'.github/workflows/ci.yml',
									ciYml(expected, { postgres: needsPostgres(repo) })
								)
						}
					: undefined
			)
			return found.outcome('')
		}
		for (const use of uses) {
			if (use.ref !== WORKFLOW_TAG) {
				found.error(
					`${use.file} usa ${use.workflow}.yml@${use.ref}: va por el tag @${WORKFLOW_TAG}`
				)
			}
			if (use.workflow !== expected) {
				found.warn(
					`${use.file} usa ${use.workflow}.yml; para un repo de ${repo.kind === 'web' ? 'front' : 'servicios o librerías'} es ${expected}.yml`
				)
			}
		}
		for (const file of workflows) {
			const content = repo.read(file) ?? ''
			// Publicar corre sus propios chequeos antes de subir: está bien.
			if (/\bpublish\b/.test(content)) continue
			if (/run:\s*pnpm (check|lint|typecheck)\b/.test(content)) {
				found.warn(
					`${file} corre pasos de CI a mano: el CI sale del workflow reutilizable`
				)
			}
		}
		const callers = new Set(uses.map(u => u.file))
		const doctorOn = [...callers].some(file =>
			/^\s*doctor:\s*true\s*$/m.test(repo.read(file) ?? '')
		)
		if (!doctorOn) {
			found.warn(
				`el CI todavía no corre henko doctor: sumar "doctor: true" en el with: de ${[...callers].join(', ')}`
			)
		}
		return found.outcome(`${expected}.yml@${WORKFLOW_TAG} con henko doctor`)
	}
}

export const RENOVATE_PRESET = `github>${STANDARDS_REPO}:renovate-config`

export const renovateCheck: Check = {
	id: 'renovate',
	title: 'Renovate',
	kinds: ['service', 'web', 'lib'],
	run: repo => {
		const found = new Findings()
		const file = [
			'renovate.json',
			'renovate.json5',
			'.renovaterc',
			'.renovaterc.json',
			'.github/renovate.json'
		].find(f => repo.exists(f))
		if (!file) {
			found.warn(`falta renovate.json que extienda ${RENOVATE_PRESET}`, {
				description: 'crea renovate.json con el preset de Henko',
				apply: () =>
					writeRepoFile(
						repo.root,
						'renovate.json',
						`${JSON.stringify(
							{
								$schema: 'https://docs.renovatebot.com/renovate-schema.json',
								extends: [RENOVATE_PRESET]
							},
							null,
							'\t'
						)}\n`
					)
			})
		} else if (!(repo.read(file) ?? '').includes(RENOVATE_PRESET)) {
			found.error(`${file} no extiende ${RENOVATE_PRESET}`)
		}
		return found.outcome(`extiende ${RENOVATE_PRESET}`)
	}
}
