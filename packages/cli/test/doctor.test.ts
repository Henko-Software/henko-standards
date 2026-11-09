import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { importsOf } from '../src/doctor/checks/hexagonal.js'
import { breakingLag, parseVersion } from '../src/doctor/checks/versions.js'
import { hasFailures, runDoctor } from '../src/doctor/index.js'
import type { CheckResult } from '../src/doctor/types.js'
import { newService } from '../src/new/service.js'
import { writeRepoFile } from '../src/standardFiles.js'

const dirs: string[] = []
const tempDir = () => {
	const dir = mkdtempSync(join(tmpdir(), 'henko-doctor-'))
	dirs.push(dir)
	return dir
}

afterEach(() => {
	for (const dir of dirs.splice(0))
		rmSync(dir, { recursive: true, force: true })
})

const git = (cwd: string, ...args: string[]) =>
	execFileSync('git', args, { cwd, stdio: 'ignore' })

/** Un servicio recién generado, con todo staged en git. */
const freshService = () => {
	const { dir } = newService({ name: 'stock', port: 3290, cwd: tempDir() })
	git(dir, 'init', '-q', '-b', 'main')
	git(dir, 'add', '-A')
	return dir
}

const doctor = (
	root: string,
	options: { fix?: boolean; latest?: Record<string, string> } = {}
) =>
	runDoctor(root, {
		fix: options.fix ?? false,
		offline: options.latest === undefined,
		maxLag: 1,
		latestVersion: async name => options.latest?.[name] ?? null
	})

const byId = (results: CheckResult[], id: string) => {
	const result = results.find(r => r.id === id)
	if (!result) throw new Error(`no está el chequeo ${id}`)
	return result
}

describe('henko doctor sobre un servicio generado', () => {
	it('cumple el estándar recién creado', async () => {
		const report = await doctor(freshService())
		expect(report.repo.kind).toBe('service')
		const notOk = report.results.filter(
			r => r.status !== 'ok' && r.status !== 'skip'
		)
		// Sin red, lo único que no puede afirmar son las versiones.
		expect(notOk.map(r => [r.id, r.status])).toEqual([['versiones', 'warn']])
		expect(hasFailures(report)).toBe(false)
	})

	it('marca el dominio que importa un adaptador o infraestructura', async () => {
		const dir = freshService()
		writeRepoFile(
			dir,
			'src/domain/stock.ts',
			"import pg from 'pg'\nimport { x } from '../adapters/out/postgres/repo.js'\nexport const y = [pg, x]\n"
		)
		writeRepoFile(
			dir,
			'src/application/use-cases/move.ts',
			"import { z } from '../../adapters/in/http/dto.js'\nexport const w = z\n"
		)
		const report = await doctor(dir)
		const hex = byId(report.results, 'hexagonal')
		expect(hex.status).toBe('fail')
		expect(hex.details.join('\n')).toMatch(/dominio\) importa pg/)
		expect(hex.details.join('\n')).toMatch(/dominio\) importa \.\.\/adapters/)
		expect(hex.details.join('\n')).toMatch(/casos de uso\) importa/)
	})

	it('sólo el BFF puede no tener dominio', async () => {
		const dir = freshService()
		rmSync(join(dir, 'src/domain'), { recursive: true, force: true })
		git(dir, 'add', '-A')
		const service = await doctor(dir)
		expect(byId(service.results, 'hexagonal').details.join()).toMatch(
			/no hay src\/domain/
		)

		const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
			name: string
		}
		writeFileSync(
			join(dir, 'package.json'),
			JSON.stringify({ ...pkg, name: 'henko-bff' })
		)
		const bff = await doctor(dir)
		expect(byId(bff.results, 'hexagonal').details.join()).not.toMatch(
			/no hay src\/domain/
		)
	})

	it('marca copias locales de configs y el .env commiteado', async () => {
		const dir = freshService()
		writeFileSync(join(dir, '.prettierrc'), '{}')
		writeFileSync(join(dir, '.env.local'), 'X=1\n')
		git(dir, 'add', '-f', '.env.local')
		writeRepoFile(dir, 'docs/BASE.md', '# Reglas base de Henko\n')
		const report = await doctor(dir)
		expect(byId(report.results, 'prettier').status).toBe('fail')
		expect(byId(report.results, 'env').details.join()).toMatch(
			/\.env\.local está commiteado/
		)
		expect(byId(report.results, 'copias').status).toBe('fail')
	})

	it('--fix crea lo que falta sin pisar nada', async () => {
		const dir = freshService()
		for (const file of ['lefthook.yml', 'commitlint.config.js', '.npmrc']) {
			rmSync(join(dir, file))
		}
		rmSync(join(dir, '.github'), { recursive: true })
		const before = await doctor(dir)
		expect(hasFailures(before)).toBe(true)

		const after = await doctor(dir, { fix: true })
		expect(after.applied.length).toBeGreaterThanOrEqual(4)
		expect(hasFailures(after)).toBe(false)
		const ci = readFileSync(join(dir, '.github/workflows/ci.yml'), 'utf8')
		expect(ci).toContain('ci-lib.yml@v0')
		expect(ci).toContain('postgres: true')
		expect(ci).toContain('doctor: true')
	})

	it('un workflow fuera de @v0 falla', async () => {
		const dir = freshService()
		const path = join(dir, '.github/workflows/ci.yml')
		writeFileSync(
			path,
			readFileSync(path, 'utf8').replace('ci-lib.yml@v0', 'ci-lib.yml@main')
		)
		const report = await doctor(dir)
		expect(byId(report.results, 'ci').status).toBe('fail')
	})

	it('versiones: avisa con una que rompe atrás y falla con dos', async () => {
		const dir = freshService()
		const warn = await doctor(dir, {
			latest: { '@henko-software/pg': '0.3.4' }
		})
		expect(byId(warn.results, 'versiones').status).toBe('warn')
		const fail = await doctor(dir, {
			latest: { '@henko-software/pg': '0.4.0' }
		})
		const versions = byId(fail.results, 'versiones')
		expect(versions.status).toBe('fail')
		expect(versions.details.join()).toMatch(
			/@henko-software\/pg \^0\.2\.0 → 0\.4\.0/
		)
	})

	it('respeta henko.doctor.ignore con motivo', async () => {
		const dir = freshService()
		const pkgPath = join(dir, 'package.json')
		const pkg: Record<string, unknown> = JSON.parse(
			readFileSync(pkgPath, 'utf8')
		)
		writeFileSync(
			pkgPath,
			JSON.stringify({
				...pkg,
				henko: { doctor: { ignore: { readme: 'repo de prueba sin README' } } }
			})
		)
		rmSync(join(dir, 'README.md'))
		const report = await doctor(dir)
		expect(byId(report.results, 'readme').status).toBe('skip')
	})
})

describe('repos que no son servicios', () => {
	it('una carpeta de documentación sólo pide README y nada de .env', async () => {
		const dir = tempDir()
		writeFileSync(join(dir, 'README.md'), '# notas\n\nQué es esto.\n')
		git(dir, 'init', '-q')
		git(dir, 'add', '-A')
		const report = await doctor(dir)
		expect(report.repo.kind).toBe('docs')
		expect(hasFailures(report)).toBe(false)
	})
})

describe('piezas', () => {
	it('cuenta versiones que rompen en 0.x y desde 1.0', () => {
		const v = (s: string) => parseVersion(s) ?? { major: 0, minor: 0, patch: 0 }
		expect(breakingLag(v('^0.1.0'), v('0.1.9'))).toBe(0)
		expect(breakingLag(v('^0.1.0'), v('0.2.0'))).toBe(1)
		expect(breakingLag(v('~0.1.3'), v('0.3.0'))).toBe(2)
		expect(breakingLag(v('^1.2.0'), v('1.9.0'))).toBe(0)
		expect(breakingLag(v('^1.2.0'), v('3.0.0'))).toBe(2)
		expect(breakingLag(v('^0.9.0'), v('1.0.0'))).toBeGreaterThan(1)
	})

	it('lee imports estáticos, dinámicos y re-exports', () => {
		const source = `import a from 'a'
import type { B } from "./b.js"
export { c } from '../c.js'
import './side.js'
const d = await import('d')`
		expect(importsOf(source)).toEqual([
			'a',
			'./b.js',
			'../c.js',
			'./side.js',
			'd'
		])
	})
})
