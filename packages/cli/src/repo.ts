import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { z } from 'zod'

/** Qué tipo de repo es: decide qué se le pide. */
export const repoKinds = ['service', 'web', 'lib', 'docs', 'standards'] as const
export type RepoKind = (typeof repoKinds)[number]

export const kindLabel: Record<RepoKind, string> = {
	service: 'servicio',
	web: 'front',
	lib: 'librerías',
	docs: 'documentación',
	standards: 'estándares'
}

const dependencyMap = z.record(z.string(), z.string()).optional()

/**
 * Lo que `henko doctor` lee del package.json. Todo lo demás se ignora.
 * `henko.doctor.ignore` saltea un chequeo, siempre con el motivo escrito.
 */
export const packageJsonSchema = z.looseObject({
	name: z.string().optional(),
	version: z.string().optional(),
	private: z.boolean().optional(),
	scripts: z.record(z.string(), z.string()).optional(),
	dependencies: dependencyMap,
	devDependencies: dependencyMap,
	peerDependencies: dependencyMap,
	optionalDependencies: dependencyMap,
	prettier: z.unknown().optional(),
	'lint-staged': z.unknown().optional(),
	henko: z
		.object({
			kind: z.enum(repoKinds).optional(),
			doctor: z
				.object({
					ignore: z.record(z.string(), z.string().min(5)).optional(),
					maxLag: z.number().int().min(0).optional()
				})
				.optional()
		})
		.optional()
})
export type PackageJson = z.infer<typeof packageJsonSchema>

const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'dist',
	'.next',
	'.turbo',
	'coverage',
	'.build',
	'build',
	'out'
])

export type Repo = {
	root: string
	name: string
	pkg: PackageJson | null
	/** Si el package.json no se pudo leer, por qué. */
	pkgError: string | null
	kind: RepoKind
	/** Archivos del repo (relativos, con `/`), sin node_modules ni builds. */
	files: string[]
	/** Archivos que git sigue; null si no es un repo de git. */
	tracked: string[] | null
	exists: (rel: string) => boolean
	read: (rel: string) => string | null
	isIgnoredByGit: (rel: string) => boolean | null
}

const walk = (root: string, dir = root, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (SKIP_DIRS.has(entry.name)) continue
			walk(root, join(dir, entry.name), out)
		} else if (entry.isFile()) {
			out.push(relative(root, join(dir, entry.name)).split(sep).join('/'))
		}
	}
	return out
}

const git = (root: string, args: string[]): string | null => {
	try {
		return execFileSync('git', args, {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		})
	} catch {
		return null
	}
}

const parsePackageJson = (
	raw: string | null
): { pkg: PackageJson | null; error: string | null } => {
	if (raw === null) return { pkg: null, error: null }
	let json: unknown
	try {
		json = JSON.parse(raw)
	} catch {
		return { pkg: null, error: 'package.json no es JSON válido' }
	}
	const parsed = packageJsonSchema.safeParse(json)
	if (!parsed.success) {
		const problems = parsed.error.issues
			.map(i => `${i.path.join('.') || '(raíz)'}: ${i.message}`)
			.join('; ')
		return { pkg: null, error: `package.json inválido: ${problems}` }
	}
	return { pkg: parsed.data, error: null }
}

const allDeps = (pkg: PackageJson): Record<string, string> => ({
	...pkg.dependencies,
	...pkg.devDependencies,
	...pkg.peerDependencies
})

/** Todos los package.json del repo (raíz y paquetes del workspace). */
export const packageJsonFiles = (repo: Repo): string[] =>
	repo.files.filter(f => f === 'package.json' || f.endsWith('/package.json'))

const detectKind = (
	root: string,
	pkg: PackageJson | null,
	files: string[]
): RepoKind => {
	if (pkg?.henko?.kind) return pkg.henko.kind
	if (!pkg) return 'docs'
	if (pkg.name === 'henko-standards') return 'standards'
	const read = (rel: string) => {
		try {
			return readFileSync(join(root, rel), 'utf8')
		} catch {
			return null
		}
	}
	const deps = files
		.filter(f => f === 'package.json' || f.endsWith('/package.json'))
		.map(f => parsePackageJson(read(f)).pkg)
		.filter((p): p is PackageJson => p !== null)
		.map(allDeps)
	if (deps.some(d => 'next' in d)) return 'web'
	// Un monorepo de paquetes (henko-libs) puede tener uno que use Nest: es
	// librería igual. Servicio es el repo que corre Nest en su raíz.
	if ('@nestjs/core' in allDeps(pkg)) return 'service'
	return 'lib'
}

/** Lee lo que hace falta del repo una sola vez; los chequeos no tocan el disco. */
export const loadRepo = (root: string): Repo => {
	const files = walk(root)
	const read = (rel: string): string | null => {
		const path = join(root, rel)
		try {
			return statSync(path).isFile() ? readFileSync(path, 'utf8') : null
		} catch {
			return null
		}
	}
	const { pkg, error } = parsePackageJson(read('package.json'))
	const lsFiles = existsSync(join(root, '.git'))
		? git(root, ['ls-files', '-z'])
		: null
	const tracked = lsFiles === null ? null : lsFiles.split('\0').filter(Boolean)
	return {
		root,
		name: pkg?.name ?? basename(root),
		pkg,
		pkgError: error,
		kind: detectKind(root, pkg, files),
		files,
		tracked,
		exists: rel => existsSync(join(root, rel)),
		read,
		isIgnoredByGit: rel => {
			if (tracked === null) return null
			try {
				execFileSync('git', ['check-ignore', '-q', '--no-index', rel], {
					cwd: root,
					stdio: 'ignore'
				})
				return true
			} catch {
				return false
			}
		}
	}
}

export { allDeps }
