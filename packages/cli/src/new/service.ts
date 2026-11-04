import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { writeRepoFile } from '../standardFiles.js'

/**
 * `henko new service <nombre>`: arma un servicio con la forma de
 * henko-identity (domain → application → adapters, composition, migraciones,
 * trazas, CI). Reemplaza al template repo: la plantilla vive en este paquete
 * y se actualiza con él.
 */
export const TEMPLATE_DIR = fileURLToPath(
	new URL('../../templates/service', import.meta.url)
)

export type NewServiceOptions = {
	name: string
	port: number
	/** Dónde crearlo. Por defecto `./henko-<nombre>`. */
	dir?: string
	cwd: string
}

/** Un nombre corto: es la base de Postgres, el rol, la audiencia y el stream. */
export const SERVICE_NAME = /^[a-z][a-z0-9]{1,30}$/

const RESERVED = new Set([
	'bff',
	'web',
	'console',
	'infra',
	'libs',
	'contracts',
	'standards'
])

export const validateServiceName = (name: string): string | null => {
	if (!SERVICE_NAME.test(name)) {
		return 'el nombre va en minúsculas, sin guiones ni espacios, de 2 a 31 letras o números (ej.: stock, ventas, facturacion)'
	}
	if (RESERVED.has(name))
		return `«${name}» ya es el nombre de otro repo de Henko`
	return null
}

const listTemplate = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name)
		if (entry.isDirectory()) listTemplate(path, out)
		else out.push(path)
	}
	return out
}

/**
 * En la plantilla, lo que empieza con `.` va con `_` (`_gitignore`,
 * `_github/`): npm no publica `.gitignore` ni `.npmrc`.
 */
const targetPath = (templateRel: string) =>
	templateRel
		.split(sep)
		.map(part => (part.startsWith('_') ? `.${part.slice(1)}` : part))
		.join('/')

export const renderTemplate = (
	content: string,
	vars: { name: string; port: number }
): string =>
	content
		.replaceAll(
			'__Name__',
			vars.name.charAt(0).toUpperCase() + vars.name.slice(1)
		)
		.replaceAll('__NAME__', vars.name.toUpperCase())
		.replaceAll('__name__', vars.name)
		.replaceAll('__port__', String(vars.port))

export const newService = (
	options: NewServiceOptions
): { dir: string; files: string[] } => {
	const problem = validateServiceName(options.name)
	if (problem) throw new Error(problem)
	if (
		!Number.isInteger(options.port) ||
		options.port < 1024 ||
		options.port > 65535
	) {
		throw new Error('--port tiene que ser un número entre 1024 y 65535')
	}
	const dir = resolve(options.cwd, options.dir ?? `henko-${options.name}`)
	if (existsSync(dir) && readdirSync(dir).length > 0) {
		throw new Error(`${dir} ya existe y no está vacío`)
	}
	const files: string[] = []
	for (const source of listTemplate(TEMPLATE_DIR)) {
		const rel = targetPath(relative(TEMPLATE_DIR, source))
		const content = renderTemplate(readFileSync(source, 'utf8'), {
			name: options.name,
			port: options.port
		})
		writeRepoFile(dir, rel, content)
		files.push(rel)
	}
	return { dir, files: files.sort() }
}

export const nextSteps = (name: string, dir: string, port: number): string =>
	[
		`Listo: henko-${name} en ${dir} (puerto ${port}).`,
		'',
		'Lo que sigue:',
		`  1. cd ${dir} && git init -b main && pnpm install && pnpm format`,
		'     (install necesita NODE_AUTH_TOKEN con read:packages; format acomoda los\n     renglones al largo del nombre)',
		`  2. Contrato: packages/contracts-${name} en henko-contracts (rutas, schemas, errores, eventos).`,
		`  3. henko-infra: sumar «${name}» a HENKO_SERVICES en .env y .env.example y correr el init de`,
		'     Postgres (README de henko-infra, «Sumar un servicio»). Anotar el puerto.',
		`  4. cp .env.example .env, completar BFF_PUBLIC_KEY_PEM, pnpm migrate y pnpm dev.`,
		`  5. gh repo create Henko-Software/henko-${name} --private --source . --push`,
		'  6. henko doctor (y pnpm check, pnpm typecheck, pnpm test) antes del primer push.'
	].join('\n')
