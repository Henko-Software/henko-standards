import { posix } from 'node:path'

import type { Repo } from '../../repo.js'
import { type Check, Findings } from '../types.js'

/** Infraestructura: no entra ni al dominio ni a los casos de uso. */
const INFRA = [
	/^@nestjs\//,
	/^(pg|pg-.+|nats|ioredis|redis|axios|express|kysely|drizzle-orm)(\/|$)/,
	/^@prisma\//,
	/^@opentelemetry\//,
	/^node:(http|https|net|dgram|child_process)$/,
	/^@henko-software\/(pg|outbox|audit|nest|tracing-node|service-auth)(\/|$)/
]

const IMPORT =
	/(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;])import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

export const importsOf = (source: string): string[] =>
	[...source.matchAll(IMPORT)]
		.map(m => m[1] ?? m[2] ?? m[3] ?? '')
		.filter(Boolean)

type Layer = 'domain' | 'application' | 'adapters' | 'other'

/** Dónde vive un archivo: `<base>/src/<capa>/…`. */
const locate = (
	file: string
): { base: string; layer: Layer; rest: string } | null => {
	const match = /^(.*?)(?:^|\/)src\/(domain|application|adapters)\/(.*)$/.exec(
		file
	)
	if (!match) return null
	return {
		base: match[1] ?? '',
		layer: (match[2] as Layer | undefined) ?? 'other',
		rest: match[3] ?? ''
	}
}

const isTest = (file: string) =>
	/\.(test|spec)\.tsx?$/.test(file) || /\/(test|__tests__)\//.test(file)

/** El adaptador al que pertenece un archivo: `in/http`, `out/postgres`. */
const adapterOf = (rest: string) => rest.split('/').slice(0, 2).join('/')

export const hexagonalViolations = (repo: Repo): string[] => {
	const problems: string[] = []
	for (const file of repo.files) {
		if (!/\.tsx?$/.test(file) || isTest(file)) continue
		const where = locate(file)
		if (!where) continue
		for (const spec of importsOf(repo.read(file) ?? '')) {
			if (spec.startsWith('.')) {
				const target = posix.normalize(posix.join(posix.dirname(file), spec))
				const to = locate(target)
				const leavesSrc = !to || to.base !== where.base
				if (where.layer === 'domain' && (leavesSrc || to.layer !== 'domain')) {
					problems.push(
						`${file} (dominio) importa ${spec}: el dominio no conoce otras capas`
					)
				} else if (
					where.layer === 'application' &&
					(to?.layer === 'adapters' ||
						target.endsWith('/composition.js') ||
						target.endsWith('/composition'))
				) {
					problems.push(
						`${file} (casos de uso) importa ${spec}: se habla con puertos, no con adaptadores`
					)
				} else if (
					where.layer === 'adapters' &&
					to?.layer === 'adapters' &&
					to.base === where.base &&
					adapterOf(to.rest) !== adapterOf(where.rest) &&
					to.rest.split('/').length > 2
				) {
					problems.push(`${file} importa otro adaptador (${spec})`)
				}
			} else if (
				where.layer !== 'adapters' &&
				INFRA.some(re => re.test(spec))
			) {
				problems.push(
					`${file} (${where.layer === 'domain' ? 'dominio' : 'casos de uso'}) importa ${spec}: la infraestructura entra por un adaptador`
				)
			}
		}
	}
	return problems
}

export const hexagonalCheck: Check = {
	id: 'hexagonal',
	title: 'Capas hexagonales',
	kinds: ['service', 'lib'],
	run: repo => {
		const found = new Findings()
		if (repo.kind === 'service') {
			const has = (dir: string) => repo.files.some(f => f.startsWith(`${dir}/`))
			for (const dir of ['src/application', 'src/adapters']) {
				if (!has(dir)) {
					found.error(
						`falta ${dir}/ (forma de henko-identity: domain → application → adapters)`
					)
				}
			}
			if (!has('src/domain')) {
				found.warn(
					'no hay src/domain/: vale sólo si el servicio no tiene datos ni reglas propias (como el BFF)'
				)
			}
			if (!repo.exists('src/composition.ts')) {
				found.warn(
					'no hay src/composition.ts: qué adaptador va en cada puerto se arma en un solo lugar'
				)
			}
		}
		const hasLayers = repo.files.some(f => locate(f) !== null)
		if (!hasLayers && repo.kind === 'lib') {
			return found.outcome('sin capas que revisar')
		}
		for (const problem of hexagonalViolations(repo)) found.error(problem)
		return found.outcome(
			'domain y application no importan adaptadores ni infraestructura'
		)
	}
}
