import { fileURLToPath } from 'node:url'
import pg from 'pg'

import { runMigrations } from '@henko-software/pg'

import { readSecret } from '../config/env.js'

/**
 * Corre las migraciones de `migrations/` con el rol dueño del schema
 * (`MIGRATIONS_DATABASE_URL`, `__name___owner`), nunca con el del servicio.
 */
const url = readSecret('MIGRATIONS_DATABASE_URL')
if (!url) throw new Error('Falta MIGRATIONS_DATABASE_URL (rol __name___owner).')

const pool = new pg.Pool({ connectionString: url })
try {
	const dir = fileURLToPath(new URL('../../migrations', import.meta.url))
	const { applied, skipped } = await runMigrations(pool, dir)
	console.info(
		`Migraciones: ${applied.length} aplicadas (${applied.join(', ') || '—'}), ${skipped.length} ya estaban.`
	)
} finally {
	await pool.end()
}
