#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { hasFailures, runDoctor } from './doctor/index.js'
import { formatReport, githubAnnotations, jsonReport } from './doctor/report.js'
import { newService, nextSteps } from './new/service.js'
import { latestVersion } from './registry.js'

const HELP = `henko: herramientas de los estándares de Henko

Uso:
  henko doctor [carpetas…] [--fix] [--json] [--offline] [--max-lag N] [--verbose]
      Chequea que cada repo cumpla el estándar (por defecto, la carpeta actual).
      Sale con código 1 si hay alguna falla.
        --fix        crea lo que falta cuando es seguro (no pisa nada)
        --json       salida en JSON
        --offline    no consulta las versiones publicadas
        --max-lag N  versiones que rompen que un paquete puede atrasarse (1)
        --verbose    muestra también lo que no aplica

  henko new service <nombre> --port <puerto> [--dir <carpeta>]
      Arma henko-<nombre> con la forma de henko-identity.

  henko --version`

const version = (): string => {
	const raw: unknown = JSON.parse(
		readFileSync(new URL('../package.json', import.meta.url), 'utf8')
	)
	return typeof raw === 'object' && raw !== null && 'version' in raw
		? String(raw.version)
		: 'desconocida'
}

const doctor = async (args: string[]): Promise<number> => {
	const { values, positionals } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			fix: { type: 'boolean', default: false },
			json: { type: 'boolean', default: false },
			offline: { type: 'boolean', default: false },
			verbose: { type: 'boolean', default: false },
			'max-lag': { type: 'string', default: '1' }
		}
	})
	const maxLag = Number(values['max-lag'])
	if (!Number.isInteger(maxLag) || maxLag < 0) {
		console.error('--max-lag tiene que ser un entero ≥ 0')
		return 2
	}
	const dirs = positionals.length > 0 ? positionals : ['.']
	const reports = []
	for (const dir of dirs) {
		reports.push(
			await runDoctor(resolve(dir), {
				fix: values.fix,
				offline: values.offline,
				maxLag,
				latestVersion
			})
		)
	}
	if (values.json) {
		console.log(jsonReport(reports))
	} else {
		console.log(
			reports
				.map(r => formatReport(r, { verbose: values.verbose }))
				.join('\n\n')
		)
		if (process.env.GITHUB_ACTIONS === 'true') {
			const annotations = reports.map(githubAnnotations).filter(Boolean)
			if (annotations.length > 0) console.log(annotations.join('\n'))
		}
	}
	return reports.some(hasFailures) ? 1 : 0
}

const create = (args: string[]): number => {
	const { values, positionals } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			port: { type: 'string' },
			dir: { type: 'string' }
		}
	})
	const [kind, name] = positionals
	if (kind !== 'service' || !name) {
		console.error('Uso: henko new service <nombre> --port <puerto>')
		return 2
	}
	if (!values.port) {
		console.error(
			'Falta --port: elegí uno libre (identity 3201, bff 3200; mirá henko-infra).'
		)
		return 2
	}
	const port = Number(values.port)
	const { dir, files } = newService({
		name,
		port,
		cwd: process.cwd(),
		...(values.dir ? { dir: values.dir } : {})
	})
	console.log(`${files.length} archivos creados.\n`)
	console.log(nextSteps(name, dir, port))
	return 0
}

const main = async (argv: string[]): Promise<number> => {
	const [command, ...rest] = argv
	switch (command) {
		case 'doctor':
			return doctor(rest)
		case 'new':
			return create(rest)
		case '--version':
		case '-v':
			console.log(version())
			return 0
		case undefined:
		case 'help':
		case '--help':
		case '-h':
			console.log(HELP)
			return 0
		default:
			console.error(`No conozco el comando «${command}».\n\n${HELP}`)
			return 2
	}
}

main(process.argv.slice(2)).then(
	code => {
		process.exitCode = code
	},
	(error: unknown) => {
		console.error(error instanceof Error ? error.message : String(error))
		process.exitCode = 2
	}
)
