import { type DynamicModule, Module } from '@nestjs/common'

import { HealthController } from './controllers.js'
import { HEALTH_CHECK, USE_CASES } from './tokens.js'
import type { __Name__UseCases } from './useCases.js'

/** Módulo HTTP de __name__. Recibe los casos de uso ya armados. */
@Module({})
class AppModule {
	static create(
		useCases: __Name__UseCases,
		checkDb: () => Promise<void>
	): DynamicModule {
		return {
			module: AppModule,
			controllers: [HealthController],
			providers: [
				{ provide: USE_CASES, useValue: useCases },
				{ provide: HEALTH_CHECK, useValue: checkDb }
			]
		}
	}
}

export { AppModule }
