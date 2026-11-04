import { connect, type NatsConnection } from 'nats'
import pg from 'pg'

import { createLogger } from '@henko-software/logger'
import { NatsMessageBus, OutboxRelay } from '@henko-software/outbox'
import { createInternalTokenVerifier } from '@henko-software/service-auth'

import { createApp } from './adapters/in/http/createApp.js'
import { ensureStreams } from './adapters/out/nats/streams.js'
import { buildUseCases } from './composition.js'
import { loadEnv } from './config/env.js'
import { stopTracing } from './instrumentation.js'
import { postgresPorts } from './postgresPorts.js'

const env = loadEnv()
const logger = createLogger({
	service: '__name__',
	version: env.SERVICE_VERSION,
	instance: env.HENKO_INSTANCE,
	level: env.LOG_LEVEL
})

const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 })
const ports = postgresPorts(pool)
const useCases = buildUseCases(ports)

const verifier = await createInternalTokenVerifier({
	audience: '__name__',
	trustedIssuers: { bff: env.BFF_PUBLIC_KEY_PEM }
})

const app = await createApp({
	useCases,
	verifier,
	logger,
	checkDb: async () => {
		await pool.query('SELECT 1')
	}
})

let nats: NatsConnection | undefined
let relay: OutboxRelay | undefined
if (env.NATS_URL) {
	nats = await connect({ servers: env.NATS_URL, name: '__name__' })
	await ensureStreams(nats)
	relay = new OutboxRelay({
		transactions: ports.transactions,
		bus: new NatsMessageBus(nats.jetstream()),
		onError: (error, eventId) =>
			logger.error(
				{ err: error, event_id: eventId },
				'No se pudo publicar un evento del outbox'
			)
	})
	relay.start()
} else {
	logger.warn(
		'Sin NATS_URL: los eventos quedan en el outbox hasta que haya bus'
	)
}

await app.listen(env.PORT)
logger.info({ port: env.PORT }, '__name__ escuchando')

const shutdown = async (signal: string) => {
	logger.info({ signal }, '__name__ apagándose')
	relay?.stop()
	await app.close()
	await nats?.drain()
	await pool.end()
	await stopTracing()
	process.exit(0)
}
process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))
