import { Writable } from 'node:stream'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createLogger } from '@henko-software/logger'
import {
	createInternalTokenSigner,
	createInternalTokenVerifier,
	generateServiceKeyPair
} from '@henko-software/service-auth'

import { createApp } from '../adapters/in/http/createApp.js'
import { buildUseCases } from '../composition.js'
import { memoryPorts } from './memoryPorts.js'

/** La puerta HTTP sin base: salud pública y todo lo demás con token interno. */
describe('__name__ por HTTP', () => {
	const bff = generateServiceKeyPair()
	const stranger = generateServiceKeyPair()
	let app: INestApplication
	let http: ReturnType<typeof request>

	beforeAll(async () => {
		app = await createApp({
			useCases: buildUseCases(memoryPorts()),
			verifier: await createInternalTokenVerifier({
				audience: '__name__',
				trustedIssuers: { bff: bff.publicKeyPem }
			}),
			logger: createLogger({
				service: '__name__',
				version: 'test',
				instance: 'test',
				destination: new Writable({ write: (_c, _e, cb) => cb() })
			}),
			checkDb: async () => undefined
		})
		await app.init()
		http = request(app.getHttpServer())
	})

	afterAll(async () => {
		await app?.close()
	})

	it('salud sin token', async () => {
		const res = await http.get('/health')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ status: 'ok', db: 'ok' })
		expect(res.headers['x-powered-by']).toBeUndefined()
	})

	it('sin token válido, 401 (default-deny)', async () => {
		const noToken = await http.get('/internal/algo')
		expect(noToken.status).toBe(401)
		expect(noToken.body.error).toMatchObject({ code: 'common.unauthenticated' })

		const forged = await createInternalTokenSigner({
			issuer: 'bff',
			privateKeyPem: stranger.privateKeyPem
		})
		const forgedToken = await forged.sign('__name__', {
			actor: { origin: 'person', id: 'u1', role: 'admin' }
		})
		const res = await http
			.get('/internal/algo')
			.set('authorization', `Bearer ${forgedToken}`)
		expect(res.status).toBe(401)
	})

	it('con token del BFF pasa la puerta', async () => {
		const signer = await createInternalTokenSigner({
			issuer: 'bff',
			privateKeyPem: bff.privateKeyPem
		})
		const token = await signer.sign('__name__', {
			actor: { origin: 'person', id: 'u1', role: 'admin' }
		})
		const res = await http
			.get('/internal/algo')
			.set('authorization', `Bearer ${token}`)
		expect(res.status).toBe(404)
	})
})
