import type { Clock } from '@henko-software/hexagonal'
import {
	immediateTransactions,
	InMemoryAuditTrail,
	InMemoryEventPublisher
} from '@henko-software/testing'

import type { __Name__AuditAction } from '../application/auditActions.js'
import type { __Name__Ports } from '../composition.js'

/** Reloj que se puede adelantar. */
const movableClock = (iso = '2026-01-01T12:00:00.000Z') => {
	let now = new Date(iso)
	const clock: Clock & { advance(ms: number): void } = {
		now: () => new Date(now),
		advance: ms => {
			now = new Date(now.getTime() + ms)
		}
	}
	return clock
}

const memoryPorts = () =>
	({
		tx: immediateTransactions,
		audit: new InMemoryAuditTrail<__Name__AuditAction>(),
		events: new InMemoryEventPublisher(),
		clock: movableClock()
	}) satisfies __Name__Ports

export { memoryPorts, movableClock }
