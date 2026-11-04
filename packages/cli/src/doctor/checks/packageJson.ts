import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type JsonObject = { [key: string]: unknown; scripts?: Record<string, string> }

const isObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Cambia el package.json de la raíz conservando el orden de las claves y la
 * indentación con tabs de Prettier.
 */
export const updatePackageJson = (
	root: string,
	change: (pkg: JsonObject) => JsonObject
): void => {
	const path = join(root, 'package.json')
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!isObject(parsed)) throw new Error('package.json no es un objeto')
	writeFileSync(path, `${JSON.stringify(change(parsed), null, '\t')}\n`)
}
