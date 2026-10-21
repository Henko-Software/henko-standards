import base from './base.js'

/**
 * Para módulos y el orquestador (NestJS, arquitectura hexagonal). Las capas
 * sólo dependen hacia adentro:
 *
 *   adapters/ → application/ → domain/
 *
 * - `domain/` no importa nada de afuera de `domain/`: ni Nest, ni Drizzle, ni
 *   el bus, ni clientes HTTP.
 * - `application/` importa `domain/` y sus propios puertos; nunca
 *   infraestructura ni adaptadores.
 * - `adapters/` importa `application/`; un adaptador no importa a otro.
 *
 * Ver `@henko-software/agent-rules/estandares/hexagonal.md`.
 */
const INFRA = [
	'@nestjs/*',
	'drizzle-orm',
	'drizzle-orm/*',
	'pg',
	'nats',
	'ioredis',
	'axios',
	'node:http',
	'node:https',
	'@opentelemetry/*'
]

const module = [
	...base,
	{
		files: ['**/src/domain/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: [...INFRA, '**/application/**', '**/adapters/**'],
							message:
								'El dominio es TypeScript puro: no conoce infraestructura ni las otras capas.'
						}
					]
				}
			]
		}
	},
	{
		files: ['**/src/application/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: [...INFRA, '**/adapters/**'],
							message:
								'Los casos de uso hablan con puertos, no con infraestructura ni adaptadores.'
						}
					]
				}
			]
		}
	},
	{
		files: ['**/src/adapters/*/*/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/adapters/**'],
							message: 'Un adaptador no importa a otro adaptador.'
						}
					]
				}
			]
		}
	}
]

export default module
