import { packageJsonFiles, packageJsonSchema } from '../../repo.js'
import { SCOPE } from '../../standardFiles.js'
import { type Check, Findings } from '../types.js'

type Version = { major: number; minor: number; patch: number }

export const parseVersion = (raw: string): Version | null => {
	const match = /(\d+)\.(\d+)\.(\d+)/.exec(raw)
	if (!match) return null
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3])
	}
}

/**
 * Cuántas versiones que rompen hay entre lo declarado y lo último. En 0.x
 * rompe el minor (el `^0.1.0` no salta a 0.2.0); desde 1.0, el mayor.
 */
export const breakingLag = (declared: Version, latest: Version): number => {
	if (latest.major > declared.major) {
		return declared.major === 0
			? latest.major * 100
			: latest.major - declared.major
	}
	if (latest.major < declared.major) return 0
	if (declared.major === 0) return Math.max(0, latest.minor - declared.minor)
	return 0
}

type Declared = { file: string; name: string; range: string }

export const versionsCheck: Check = {
	id: 'versiones',
	title: `Versiones de ${SCOPE}/*`,
	kinds: ['service', 'web', 'lib'],
	run: async (repo, options) => {
		const found = new Findings()
		const own = new Set<string>()
		const declared: Declared[] = []
		for (const file of packageJsonFiles(repo)) {
			let json: unknown
			try {
				json = JSON.parse(repo.read(file) ?? '')
			} catch {
				continue
			}
			const parsed = packageJsonSchema.safeParse(json)
			if (!parsed.success) continue
			const pkg = parsed.data
			if (pkg.name) own.add(pkg.name)
			for (const deps of [
				pkg.dependencies,
				pkg.devDependencies,
				pkg.peerDependencies
			]) {
				for (const [name, range] of Object.entries(deps ?? {})) {
					if (name.startsWith(`${SCOPE}/`) && !range.startsWith('workspace:')) {
						declared.push({ file, name, range })
					}
				}
			}
		}
		const external = declared.filter(d => !own.has(d.name))
		if (external.length === 0) {
			return found.outcome(`no usa paquetes ${SCOPE}/* publicados`)
		}

		const byName = new Map<string, Declared[]>()
		for (const d of external)
			byName.set(d.name, [...(byName.get(d.name) ?? []), d])
		for (const [name, uses] of byName) {
			const ranges = new Set(uses.map(u => u.range))
			if (ranges.size > 1) {
				found.warn(
					`${name} con rangos distintos en el mismo repo: ${[...ranges].join(', ')}`
				)
			}
		}

		if (options.offline) {
			found.warn('sin consultar las versiones publicadas (--offline)')
			return found.outcome('')
		}
		const unknown: string[] = []
		for (const [name, uses] of byName) {
			const latestRaw = await options.latestVersion(name)
			const latest = latestRaw ? parseVersion(latestRaw) : null
			if (!latest) {
				unknown.push(name)
				continue
			}
			for (const use of uses) {
				const current = parseVersion(use.range)
				if (!current) {
					found.error(`${use.file}: ${name}@${use.range} no es un rango semver`)
					continue
				}
				const lag = breakingLag(current, latest)
				if (lag === 0) continue
				const where = use.file === 'package.json' ? '' : ` (${use.file})`
				const message = `${name} ${use.range} → ${latestRaw}${where}`
				if (lag > options.maxLag) {
					found.error(
						`${message}: ${lag} versiones que rompen atrás (se permite ${options.maxLag})`
					)
				} else {
					found.warn(
						`${message}: hay versión nueva que rompe; actualizar pronto`
					)
				}
			}
		}
		if (unknown.length > 0) {
			found.warn(
				`no pude consultar la última versión de ${unknown.join(', ')} (¿NODE_AUTH_TOKEN con read:packages?)`
			)
		}
		return found.outcome(
			`${byName.size} paquetes al día (o atrasados sólo en parches)`
		)
	}
}
