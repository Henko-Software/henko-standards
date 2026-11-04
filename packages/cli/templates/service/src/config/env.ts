import { readFileSync } from 'node:fs'
import { z } from 'zod'

/**
 * Un secreto llega como archivo (`X_FILE`, lo normal en un servidor) o, en
 * desarrollo, como variable (`X`). Los PEM en una variable pueden traer los
 * saltos de línea escapados (`\n`).
 */
const readSecret = (name: string): string | undefined => {
	const file = process.env[`${name}_FILE`]
	const value = file ? readFileSync(file, 'utf8') : process.env[name]
	return value?.replace(/\\n/g, '\n').trim() || undefined
}

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(__port__),
	HENKO_INSTANCE: z.string().min(1).default('dev'),
	SERVICE_VERSION: z.string().default('0.1.0'),
	LOG_LEVEL: z
		.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
		.default('info'),
	DATABASE_URL: z.string().min(1),
	BFF_PUBLIC_KEY_PEM: z.string().includes('BEGIN PUBLIC KEY'),
	NATS_URL: z.string().optional()
})

export type Env = z.infer<typeof envSchema>

/** Variables validadas al arrancar: si falta algo, no arranca. */
const loadEnv = (): Env => {
	const parsed = envSchema.safeParse({
		...process.env,
		DATABASE_URL: readSecret('DATABASE_URL'),
		BFF_PUBLIC_KEY_PEM: readSecret('BFF_PUBLIC_KEY_PEM'),
		NATS_URL: process.env.NATS_URL || undefined
	})
	if (!parsed.success) {
		const problems = parsed.error.issues
			.map(i => `${i.path.join('.')}: ${i.message}`)
			.join('; ')
		throw new Error(`Configuración inválida: ${problems}`)
	}
	return parsed.data
}

export { loadEnv, readSecret }
