import type { Repo, RepoKind } from '../repo.js'

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'skip'

/** Un arreglo seguro: sólo crea lo que falta o suma lo que no está. */
export type Fix = {
	/** Qué va a hacer, en castellano («crea lefthook.yml»). */
	description: string
	apply: () => void
}

export type CheckResult = {
	id: string
	title: string
	status: CheckStatus
	/** Una línea con el resumen. */
	summary: string
	/** Lo que hay que mirar, de a un problema por línea. */
	details: string[]
	fixes: Fix[]
}

export type CheckOptions = {
	/** Cuántas versiones que rompen puede atrasarse un paquete antes de fallar. */
	maxLag: number
	offline: boolean
	/** Para tests: de dónde salen las versiones publicadas. */
	latestVersion: (name: string) => Promise<string | null>
}

export type Check = {
	id: string
	title: string
	/** En qué tipos de repo corre. */
	kinds: readonly RepoKind[]
	run: (
		repo: Repo,
		options: CheckOptions
	) => Promise<CheckOutcome> | CheckOutcome
}

export type CheckOutcome = {
	status: Exclude<CheckStatus, 'skip'>
	summary: string
	details?: string[]
	fixes?: Fix[]
}

export const ok = (summary: string): CheckOutcome => ({ status: 'ok', summary })

/**
 * Junta los problemas de un chequeo: si hay alguna falla, falla; si sólo hay
 * avisos, avisa.
 */
export class Findings {
	readonly errors: string[] = []
	readonly warnings: string[] = []
	readonly fixes: Fix[] = []

	error(message: string, fix?: Fix): void {
		this.errors.push(message)
		if (fix) this.fixes.push(fix)
	}

	warn(message: string, fix?: Fix): void {
		this.warnings.push(message)
		if (fix) this.fixes.push(fix)
	}

	outcome(okSummary: string): CheckOutcome {
		if (this.errors.length > 0) {
			return {
				status: 'fail',
				summary:
					this.errors.length === 1
						? (this.errors[0] ?? '')
						: `${this.errors.length} problemas`,
				details: [...this.errors, ...this.warnings.map(w => `aviso: ${w}`)],
				fixes: this.fixes
			}
		}
		if (this.warnings.length > 0) {
			return {
				status: 'warn',
				summary:
					this.warnings.length === 1
						? (this.warnings[0] ?? '')
						: `${this.warnings.length} avisos`,
				details: this.warnings,
				fixes: this.fixes
			}
		}
		return ok(okSummary)
	}
}
