/**
 * Tokens de inyección de Nest. Toda dependencia se inyecta por token
 * explícito: vitest y tsx no emiten la metadata de tipos de los decoradores.
 */
export const USE_CASES = Symbol('__name__.useCases')
export const HEALTH_CHECK = Symbol('__name__.healthCheck')
