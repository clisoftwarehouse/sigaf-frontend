export const JWT_STORAGE_KEY = 'sigaf_token';
export const JWT_REFRESH_STORAGE_KEY = 'sigaf_refresh_token';
export const JWT_EXPIRES_AT_KEY = 'sigaf_token_expires_at';

/** Razón por la que se cerró la sesión, leída por el sign-in view para mostrar banner. */
export const SESSION_EXPIRED_REASON_KEY = 'sigaf_session_expired_reason';

/** Evento global que dispara cierre de sesión y redirección al login. */
export const SESSION_EXPIRED_EVENT = 'sigaf:session-expired';

export type SessionExpiredReason = 'idle' | 'token-expired';

/**
 * Tiempo de inactividad tras el cual se cierra automáticamente la sesión (ms).
 * 30 minutos es el balance típico para un POS/ERP de farmacia: suficiente para
 * que un usuario no sea expulsado mientras trabaja, pero no tanto que una
 * estación quede abierta toda la noche.
 */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
