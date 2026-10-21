/**
 * Verifica que las reglas propias de Henko de verdad corten: si alguien
 * rompe una regla en eslint-config, este test falla antes de publicar.
 */
import assert from 'node:assert/strict'
import { ESLint } from 'eslint'

import module from '@henko-software/eslint-config/module'
import next from '@henko-software/eslint-config/next'

const eslint = new ESLint({
	cwd: new URL('./fixtures', import.meta.url).pathname,
	overrideConfigFile: true,
	overrideConfig: next(),
	ignore: false
})

const lint = async file => {
	const [result] = await eslint.lintFiles([file])
	return result.messages.map(m => m.ruleId)
}

const bad = await lint('src/views/demo/Bad.tsx')
assert.ok(bad.includes('no-restricted-syntax'), 'hex y <button> sueltos')
assert.equal(
	bad.filter(r => r === 'no-restricted-syntax').length,
	3,
	'dos hex + un <button>'
)
assert.ok(bad.includes('no-restricted-imports'), 'adaptador importado directo')
assert.ok(bad.includes('react/jsx-no-literals'), 'texto suelto en el JSX')
assert.ok(bad.includes('import/no-default-export'), 'export default')

const good = await lint('src/views/demo/Good.tsx')
assert.deepEqual(good, [], `Good.tsx no debería tener errores: ${good}`)

const silenced = await lint('Silenced.ts')
assert.ok(silenced.includes('@typescript-eslint/ban-ts-comment'), '@ts-ignore')
assert.ok(silenced.includes('@typescript-eslint/no-explicit-any'), 'any')
assert.ok(
	silenced.includes('@eslint-community/eslint-comments/require-description'),
	'eslint-disable sin motivo'
)

// Capas hexagonales (variante module).
const moduleLint = new ESLint({
	cwd: new URL('./fixtures/module', import.meta.url).pathname,
	overrideConfigFile: true,
	overrideConfig: module,
	ignore: false
})
const lintModule = async file => {
	const [result] = await moduleLint.lintFiles([file])
	return result.messages.map(m => m.ruleId)
}

const domain = await lintModule('src/domain/BadDomain.ts')
assert.equal(
	domain.filter(r => r === 'no-restricted-imports').length,
	2,
	'el dominio no importa Nest ni adaptadores'
)
const application = await lintModule('src/application/BadUseCase.ts')
assert.ok(
	application.includes('no-restricted-imports'),
	'un caso de uso no importa Drizzle'
)
assert.deepEqual(await lintModule('src/application/GoodUseCase.ts'), [])
const adapter = await lintModule('src/adapters/out/postgres/repo.ts')
assert.ok(
	adapter.includes('no-restricted-imports'),
	'un adaptador no importa a otro'
)

console.log('reglas de ESLint: ok')
