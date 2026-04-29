import { useRef, useEffect } from 'react';

import { notifySessionExpired } from '@/shared/lib/axios';

import { IDLE_TIMEOUT_MS } from '../context/jwt/constant';

// ----------------------------------------------------------------------

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'];

/**
 * Cierra la sesión automáticamente cuando el usuario no interactúa con la app
 * por `timeoutMs` milisegundos. Cualquier evento de teclado/mouse/scroll/táctil
 * resetea el contador, así que un usuario activo nunca es expulsado.
 *
 * Cuando el timer vence dispara `sigaf:session-expired` con razón `idle`, que
 * AuthProvider escucha para limpiar el estado y forzar la redirección al login.
 *
 * Solo está activo cuando `enabled` es true (típicamente: hay sesión iniciada).
 */
export function useIdleLogout(enabled: boolean, timeoutMs: number = IDLE_TIMEOUT_MS): void {
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return undefined;

    const reset = () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        notifySessionExpired('idle');
      }, timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [enabled, timeoutMs]);
}
