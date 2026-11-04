import { defineErrors, type ErrorDefinition } from '@henko-software/errors'

/**
 * Errores propios de __name__, con el mensaje que lee la persona. Cuando
 * exista `@henko-software/contracts-__name__`, las claves salen de su
 * catálogo: `satisfies Record<__Name__ErrorKey, ErrorDefinition>`.
 *
 *   '__name__.not_found': { status: 404, message: 'No encontramos …' }
 */
const definitions = {} satisfies Record<string, ErrorDefinition>

export const __name__Errors = defineErrors(definitions)
