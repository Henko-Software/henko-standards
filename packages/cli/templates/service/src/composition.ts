import type {
	AuditTrail,
	Clock,
	EventPublisher,
	TransactionRunner
} from '@henko-software/hexagonal'

import type { __Name__AuditAction } from './application/auditActions.js'

/**
 * Qué adaptador va en cada puerto. Postgres en el servicio, memoria en tests.
 * Cada repositorio o servicio nuevo que necesite un caso de uso se suma acá.
 */
export type __Name__Ports = {
	tx: TransactionRunner
	audit: AuditTrail<__Name__AuditAction>
	events: EventPublisher
	clock: Clock
}

/**
 * Los casos de uso, armados con sus puertos. Todavía no hay ninguno: el
 * primero se suma siguiendo «Sumar un caso de uso» en AGENTS.md.
 */
const buildUseCases = (_ports: __Name__Ports) => ({})

export type BuiltUseCases = ReturnType<typeof buildUseCases>

export { buildUseCases }
