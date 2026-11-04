import type { INestApplication, LoggerService } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import type { RequestContext } from '@henko-software/core'
import type { Logger } from '@henko-software/logger'
import {
	createContextMiddleware,
	HenkoErrorFilter,
	internalTokenResolver
} from '@henko-software/nest'

import { AppModule } from './appModule.js'
import type { __Name__UseCases } from './useCases.js'

import 'reflect-metadata'

export type CreateAppOptions = {
	useCases: __Name__UseCases
	verifier: { verify: (token: string) => Promise<RequestContext> }
	logger: Logger
	checkDb: () => Promise<void>
}

/** Los logs de Nest van al mismo logger JSON que el resto. */
const nestLogger = (logger: Logger): LoggerService => ({
	log: (message: unknown) => logger.debug({ nest: true }, String(message)),
	error: (message: unknown) => logger.error({ nest: true }, String(message)),
	warn: (message: unknown) => logger.warn({ nest: true }, String(message))
})

/**
 * Arma la app HTTP. Todo request (salvo /health) tiene que traer un token
 * interno válido de un servicio confiable: default-deny.
 */
const createApp = async ({
	useCases,
	verifier,
	logger,
	checkDb
}: CreateAppOptions): Promise<INestApplication> => {
	const app = await NestFactory.create(AppModule.create(useCases, checkDb), {
		logger: nestLogger(logger)
	})
	const http = app.getHttpAdapter().getInstance() as {
		disable(name: string): void
	}
	http.disable('x-powered-by')
	app.use(
		createContextMiddleware({
			resolve: internalTokenResolver(verifier),
			publicPaths: ['/health']
		})
	)
	app.useGlobalFilters(new HenkoErrorFilter(logger))
	app.enableShutdownHooks()
	return app
}

export { createApp }
