import type { NatsConnection } from 'nats'

/** Streams de JetStream donde __name__ publica. Se crean si no existen. */
const STREAMS = [
	{ name: '__NAME__', subjects: ['__name__.>'] },
	{ name: 'AUDIT', subjects: ['audit.>'] }
]

const ensureStreams = async (nc: NatsConnection): Promise<void> => {
	const jsm = await nc.jetstreamManager()
	for (const stream of STREAMS) {
		try {
			await jsm.streams.info(stream.name)
		} catch {
			await jsm.streams.add({ name: stream.name, subjects: stream.subjects })
		}
	}
}

export { ensureStreams }
