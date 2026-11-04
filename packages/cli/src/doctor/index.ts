import { kindLabel, loadRepo, type Repo } from '../repo.js'
import { agentRulesCheck, claudePluginCheck } from './checks/agents.js'
import { ciCheck, renovateCheck } from './checks/ci.js'
import {
	commitlintCheck,
	eslintCheck,
	lefthookCheck,
	npmrcCheck,
	prettierCheck,
	tsconfigCheck
} from './checks/configs.js'
import { hexagonalCheck } from './checks/hexagonal.js'
import { copiesCheck, envCheck, readmeCheck } from './checks/hygiene.js'
import { versionsCheck } from './checks/versions.js'
import type { Check, CheckOptions, CheckResult } from './types.js'

export const CHECKS: Check[] = [
	agentRulesCheck,
	eslintCheck,
	prettierCheck,
	tsconfigCheck,
	commitlintCheck,
	lefthookCheck,
	npmrcCheck,
	ciCheck,
	renovateCheck,
	versionsCheck,
	hexagonalCheck,
	envCheck,
	readmeCheck,
	copiesCheck,
	claudePluginCheck
]

export type DoctorReport = {
	repo: Pick<Repo, 'root' | 'name' | 'kind'>
	results: CheckResult[]
	/** Arreglos aplicados con --fix. */
	applied: string[]
}

const runChecks = async (
	repo: Repo,
	options: CheckOptions
): Promise<CheckResult[]> => {
	const ignored = repo.pkg?.henko?.doctor?.ignore ?? {}
	const results: CheckResult[] = []
	if (repo.pkgError) {
		results.push({
			id: 'package',
			title: 'package.json',
			status: 'fail',
			summary: repo.pkgError,
			details: [],
			fixes: []
		})
	}
	for (const check of CHECKS) {
		const base = { id: check.id, title: check.title }
		if (!check.kinds.includes(repo.kind)) {
			results.push({
				...base,
				status: 'skip',
				summary: `no aplica a un repo de ${kindLabel[repo.kind]}`,
				details: [],
				fixes: []
			})
			continue
		}
		const reason = ignored[check.id]
		if (reason) {
			results.push({
				...base,
				status: 'skip',
				summary: `ignorado en el package.json: ${reason}`,
				details: [],
				fixes: []
			})
			continue
		}
		const outcome = await check.run(repo, options)
		results.push({
			...base,
			status: outcome.status,
			summary: outcome.summary,
			details: outcome.details ?? [],
			fixes: outcome.fixes ?? []
		})
	}
	return results
}

export const runDoctor = async (
	root: string,
	options: CheckOptions & { fix: boolean }
): Promise<DoctorReport> => {
	let repo = loadRepo(root)
	const maxLag = repo.pkg?.henko?.doctor?.maxLag ?? options.maxLag
	let results = await runChecks(repo, { ...options, maxLag })
	const applied: string[] = []
	if (options.fix) {
		for (const result of results) {
			for (const fix of result.fixes) {
				fix.apply()
				applied.push(`${result.id}: ${fix.description}`)
			}
		}
		if (applied.length > 0) {
			repo = loadRepo(root)
			results = await runChecks(repo, { ...options, maxLag })
		}
	}
	return {
		repo: { root: repo.root, name: repo.name, kind: repo.kind },
		results,
		applied
	}
}

export const hasFailures = (report: DoctorReport) =>
	report.results.some(r => r.status === 'fail')
