import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { afterAll, describe, expect, it } from 'vitest'

import { runMigrations } from '@henko-software/pg'

/**
 * Las migraciones aplican en una base vacía y la auditoría queda sin
 * UPDATE/DELETE para el rol del servicio. Corre si existe
 * HENKO_TEST_DATABASE_URL (con un usuario que pueda crear roles).
 */
const url = process.env.HENKO_TEST_DATABASE_URL

describe.skipIf(!url)('migraciones de __name__', () => {
	const admin = new pg.Pool({ connectionString: url })

	afterAll(async () => {
		await admin.end()
	})

	it('aplican y la auditoría es append-only', async () => {
		await admin.query(`
			DROP TABLE IF EXISTS audit_log, outbox, schema_migrations CASCADE;
			DO $$ BEGIN CREATE ROLE __name___app; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
			ALTER DEFAULT PRIVILEGES IN SCHEMA public
				GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO __name___app;
		`)
		const { applied } = await runMigrations(
			admin,
			fileURLToPath(new URL('../../migrations', import.meta.url))
		)
		expect(applied.length).toBeGreaterThan(0)
		const { rows } = await admin.query<{ allowed: boolean }>(
			"SELECT has_table_privilege('__name___app', 'audit_log', 'UPDATE') AS allowed"
		)
		expect(rows[0]?.allowed).toBe(false)
	})
})
