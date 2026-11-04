import type { Pool } from 'pg'

import { PgAuditTrail } from '@henko-software/audit'
import { systemClock } from '@henko-software/hexagonal'
import { PgOutboxPublisher } from '@henko-software/outbox'
import { PgTransactions } from '@henko-software/pg'

import type { __Name__AuditAction } from './application/auditActions.js'
import type { __Name__Ports } from './composition.js'

/**
 * Puertos sobre Postgres. Datos, auditoría y outbox comparten la
 * transacción del caso de uso.
 */
const postgresPorts = (
	pool: Pool
): __Name__Ports & { transactions: PgTransactions } => {
	const transactions = new PgTransactions(pool)
	const executor = () => transactions.executor()
	const events = new PgOutboxPublisher(transactions)
	return {
		transactions,
		tx: transactions,
		audit: new PgAuditTrail<__Name__AuditAction>({
			executor,
			publisher: events,
			source: '__name__'
		}),
		events,
		clock: systemClock
	}
}

export { postgresPorts }
