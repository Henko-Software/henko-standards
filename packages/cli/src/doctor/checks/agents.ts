import { z } from 'zod'

import { allDeps } from '../../repo.js'
import {
	AGENT_RULES_IMPORT,
	claudeMd,
	claudeSettings,
	MARKETPLACE_NAME,
	PLUGIN_ID,
	SCOPE,
	STANDARDS_REPO,
	writeRepoFile
} from '../../standardFiles.js'
import { type Check, Findings } from '../types.js'

export const agentRulesCheck: Check = {
	id: 'agentes',
	title: 'Reglas para agentes (CLAUDE.md)',
	kinds: ['service', 'web', 'lib'],
	run: repo => {
		const found = new Findings()
		const content = repo.read('CLAUDE.md')
		if (content === null) {
			found.error('falta CLAUDE.md', {
				description: 'crea CLAUDE.md que importa agent-rules y AGENTS.md',
				apply: () => writeRepoFile(repo.root, 'CLAUDE.md', claudeMd)
			})
		} else {
			if (!content.includes(AGENT_RULES_IMPORT)) {
				found.error(`CLAUDE.md no importa ${AGENT_RULES_IMPORT}`, {
					description: `suma ${AGENT_RULES_IMPORT} al principio de CLAUDE.md`,
					apply: () =>
						writeRepoFile(
							repo.root,
							'CLAUDE.md',
							`${AGENT_RULES_IMPORT}\n\n${content}`
						)
				})
			}
			if (!content.includes('@AGENTS.md')) {
				found.warn('CLAUDE.md no importa @AGENTS.md (lo propio del repo)')
			}
			if (/^# Reglas base de Henko/m.test(content)) {
				found.error(
					'CLAUDE.md tiene las reglas base copiadas: se importan del paquete'
				)
			}
		}
		if (!repo.exists('AGENTS.md')) {
			found.error(
				'falta AGENTS.md con lo propio del repo (qué es, capas, reglas propias)'
			)
		}
		if (repo.pkg && !(`${SCOPE}/agent-rules` in allDeps(repo.pkg))) {
			found.error(
				`falta ${SCOPE}/agent-rules en devDependencies (sin él, el import de CLAUDE.md no carga nada)`
			)
		}
		return found.outcome('CLAUDE.md importa agent-rules y AGENTS.md')
	}
}

const settingsSchema = z.looseObject({
	extraKnownMarketplaces: z.record(z.string(), z.unknown()).optional(),
	enabledPlugins: z.record(z.string(), z.unknown()).optional()
})

export const claudePluginCheck: Check = {
	id: 'plugin',
	title: 'Skills de Henko (plugin de Claude Code)',
	kinds: ['service', 'web', 'lib', 'docs'],
	run: repo => {
		const found = new Findings()
		const raw = repo.read('.claude/settings.json')
		let current: z.infer<typeof settingsSchema> = {}
		if (raw !== null) {
			let json: unknown
			try {
				json = JSON.parse(raw)
			} catch {
				found.error('.claude/settings.json no es JSON válido')
				return found.outcome('')
			}
			const parsed = settingsSchema.safeParse(json)
			if (!parsed.success) {
				found.error('.claude/settings.json tiene un formato inesperado')
				return found.outcome('')
			}
			current = parsed.data
		}
		const hasMarketplace =
			current.extraKnownMarketplaces?.[MARKETPLACE_NAME] !== undefined
		const enabled = current.enabledPlugins?.[PLUGIN_ID] === true
		if (!hasMarketplace || !enabled) {
			found.warn(
				`.claude/settings.json no habilita ${PLUGIN_ID} (marketplace ${STANDARDS_REPO})`,
				{
					description: `suma el marketplace y ${PLUGIN_ID} a .claude/settings.json`,
					apply: () =>
						writeRepoFile(
							repo.root,
							'.claude/settings.json',
							`${JSON.stringify(
								{
									...current,
									extraKnownMarketplaces: {
										...current.extraKnownMarketplaces,
										...claudeSettings.extraKnownMarketplaces
									},
									enabledPlugins: {
										...current.enabledPlugins,
										...claudeSettings.enabledPlugins
									}
								},
								null,
								'\t'
							)}\n`
						)
				}
			)
		}
		if (repo.files.some(f => /^\.claude\/skills\/.+\/SKILL\.md$/.test(f))) {
			found.warn(
				'.claude/skills/ tiene skills locales: si sirven para todos, van al plugin de henko-standards'
			)
		}
		return found.outcome(`habilita ${PLUGIN_ID}`)
	}
}
