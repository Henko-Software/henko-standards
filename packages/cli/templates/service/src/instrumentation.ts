import { initTracing } from '@henko-software/tracing-node'

/**
 * OpenTelemetry arranca antes que todo (es el primer import de main.ts), así
 * la autoinstrumentación alcanza a http, express y pg. `HENKO_TRACING=off` lo
 * apaga (tests, scripts).
 */
export const stopTracing =
	process.env.HENKO_TRACING === 'off'
		? async () => undefined
		: initTracing({
				serviceName: '__name__',
				serviceVersion: process.env.SERVICE_VERSION ?? '0.1.0',
				instance: process.env.HENKO_INSTANCE ?? 'dev'
			})
