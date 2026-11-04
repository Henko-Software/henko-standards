import { Controller, Get, Inject } from '@nestjs/common'

import { HEALTH_CHECK } from './tokens.js'

/**
 * Salud del servicio: la usa el orquestador de contenedores. Pública.
 *
 * Las rutas del módulo van en `/internal/...`, cada una con `parseInput`
 * sobre el schema del contrato y la respuesta por el DTO.
 */
@Controller('health')
class HealthController {
	constructor(
		@Inject(HEALTH_CHECK) private readonly checkDb: () => Promise<void>
	) {}

	@Get()
	async health() {
		await this.checkDb()
		return { status: 'ok', db: 'ok' }
	}
}

export { HealthController }
