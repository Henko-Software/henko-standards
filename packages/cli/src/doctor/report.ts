import { kindLabel } from '../repo.js'
import type { DoctorReport } from './index.js'
import type { CheckStatus } from './types.js'

const useColor =
	process.stdout.isTTY === true &&
	process.env.NO_COLOR === undefined &&
	process.env.GITHUB_ACTIONS !== 'true'

const paint = (code: number, text: string) =>
	useColor ? `\u001b[${code}m${text}\u001b[0m` : text

const MARK: Record<CheckStatus, string> = {
	ok: paint(32, '✓'),
	warn: paint(33, '!'),
	fail: paint(31, '✗'),
	skip: paint(90, '-')
}

const plural = (n: number, one: string, many: string) =>
	`${n} ${n === 1 ? one : many}`

/** El reporte para leer en la terminal o en el log del CI. */
export const formatReport = (
	report: DoctorReport,
	options: { verbose: boolean }
): string => {
	const out: string[] = []
	out.push(
		`henko doctor · ${report.repo.name} (${kindLabel[report.repo.kind]})`,
		''
	)
	if (report.applied.length > 0) {
		out.push('Arreglado con --fix:')
		for (const fix of report.applied) out.push(`  + ${fix}`)
		out.push('')
	}
	const width = Math.max(...report.results.map(r => r.title.length))
	for (const result of report.results) {
		if (result.status === 'skip' && !options.verbose) continue
		out.push(
			`  ${MARK[result.status]} ${result.title.padEnd(width)}  ${result.summary}`
		)
		const details = result.details.filter(d => d !== result.summary)
		if (result.status !== 'ok') {
			for (const detail of details) out.push(`      - ${detail}`)
		}
		if (result.fixes.length > 0) {
			out.push(
				`      ${paint(36, '→ henko doctor --fix')}: ${result.fixes.map(f => f.description).join('; ')}`
			)
		}
	}
	const fails = report.results.filter(r => r.status === 'fail').length
	const warns = report.results.filter(r => r.status === 'warn').length
	out.push('')
	if (fails === 0 && warns === 0) {
		out.push(paint(32, 'Cumple el estándar de Henko.'))
	} else {
		out.push(
			`${fails > 0 ? paint(31, plural(fails, 'falla', 'fallas')) : 'Sin fallas'}, ${plural(warns, 'aviso', 'avisos')}.` +
				(fails > 0 ? ' El CI no pasa hasta arreglar las fallas.' : '')
		)
	}
	return out.join('\n')
}

/** Anotaciones de GitHub Actions: cada falla aparece en el resumen del run. */
export const githubAnnotations = (report: DoctorReport): string =>
	report.results
		.filter(r => r.status === 'fail' || r.status === 'warn')
		.flatMap(r => {
			const level = r.status === 'fail' ? 'error' : 'warning'
			const lines = r.details.length > 0 ? r.details : [r.summary]
			return lines.map(
				line =>
					`::${level} title=henko doctor · ${r.title}::${line.replace(/\r?\n/g, ' ')}`
			)
		})
		.join('\n')

export const jsonReport = (reports: DoctorReport[]) =>
	JSON.stringify(
		reports.map(r => ({
			repo: r.repo,
			applied: r.applied,
			results: r.results.map(({ fixes, ...rest }) => ({
				...rest,
				fixable: fixes.map(f => f.description)
			}))
		})),
		null,
		2
	)
