import { defineAuditActions } from '@henko-software/hexagonal'

/**
 * Lo que __name__ audita, con el nombre que ve la pantalla de auditoría:
 *
 *   '__name__.<entidad>.created': 'Alta de <entidad>'
 */
export const __name__AuditActions = defineAuditActions({})

export type __Name__AuditAction = keyof typeof __name__AuditActions.catalog
