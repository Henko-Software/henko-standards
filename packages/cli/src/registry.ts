import { z } from 'zod'

import { SCOPE } from './standardFiles.js'

/**
 * La última versión publicada de un paquete `@henko-software/*`.
 *
 * 1. GitHub Packages, con `NODE_AUTH_TOKEN` (en CI es el GITHUB_TOKEN).
 * 2. Si no hay token o no alcanza (le falta `read:packages`): el package.json
 *    en `main` de los repos públicos que los publican. `release.yml` publica
 *    al mergear, así que es la misma versión salvo durante la publicación.
 */
const PUBLIC_SOURCES = ['henko-standards', 'henko-libs', 'henko-contracts']

const registrySchema = z.object({
	'dist-tags': z.object({ latest: z.string() })
})
const packageSchema = z.object({ name: z.string(), version: z.string() })

const fetchJson = async (
	url: string,
	headers: Record<string, string> = {}
): Promise<unknown> => {
	const res = await fetch(url, {
		headers,
		signal: AbortSignal.timeout(8000)
	})
	if (!res.ok) return null
	return res.json()
}

const fromRegistry = async (name: string): Promise<string | null> => {
	const token = process.env.NODE_AUTH_TOKEN
	if (!token) return null
	const json = await fetchJson(
		`https://npm.pkg.github.com/${name.replace('/', '%2f')}`,
		{ authorization: `Bearer ${token}`, accept: 'application/json' }
	).catch(() => null)
	const parsed = registrySchema.safeParse(json)
	return parsed.success ? parsed.data['dist-tags'].latest : null
}

const fromPublicRepos = async (name: string): Promise<string | null> => {
	const short = name.slice(SCOPE.length + 1)
	for (const repo of PUBLIC_SOURCES) {
		const json = await fetchJson(
			`https://raw.githubusercontent.com/Henko-Software/${repo}/main/packages/${short}/package.json`
		).catch(() => null)
		const parsed = packageSchema.safeParse(json)
		if (parsed.success && parsed.data.name === name) return parsed.data.version
	}
	return null
}

const cache = new Map<string, Promise<string | null>>()

export const latestVersion = (name: string): Promise<string | null> => {
	let pending = cache.get(name)
	if (!pending) {
		pending = fromRegistry(name).then(v => v ?? fromPublicRepos(name))
		cache.set(name, pending)
	}
	return pending
}
