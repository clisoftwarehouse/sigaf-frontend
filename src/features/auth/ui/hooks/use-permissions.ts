import { useMemo } from 'react';

import { useAuthContext } from './use-auth-context';

// ----------------------------------------------------------------------

export type PermissionsHelper = {
  /** Lista cruda de permission codes que el backend adjuntó en `/auth/me`. */
  permissions: string[];
  /** `true` si el usuario tiene TODOS los permisos pasados (AND lógico). */
  has: (...codes: string[]) => boolean;
  /** `true` si el usuario tiene AL MENOS UNO de los permisos (OR lógico). */
  hasAny: (...codes: string[]) => boolean;
  /** Atajo para `administrador` (acceso total — siempre `true`). */
  isAdmin: boolean;
};

/**
 * Hook único de autorización en el admin. Lee el `permissions[]` del user
 * cargado por el AuthProvider (que viene de `/auth/me`).
 *
 * Uso típico:
 *
 *   const can = usePermissions();
 *   if (!can.has('products.create')) return null;
 *
 * Para gating de UI en componentes:
 *
 *   <Button disabled={!can.has('inventory.adjust')}>Ajustar</Button>
 *
 * El nav del dashboard (`allowedPermissions` en cada item) lo consume
 * indirectamente vía el `checkPermissions` callback.
 */
export function usePermissions(): PermissionsHelper {
  const { user } = useAuthContext();

  return useMemo<PermissionsHelper>(() => {
    const perms = new Set(user?.permissions ?? []);
    const roleName = user?.role?.name;
    const isAdmin = roleName === 'administrador';
    return {
      permissions: Array.from(perms),
      // Admin pasa siempre todas las verificaciones — útil mientras la matriz
      // de permisos termine de poblarse (cualquier permiso nuevo queda accesible
      // para admin sin tener que tocar el seed). Esta semántica refleja la del
      // backend (administrador tiene todos los permisos en el seed).
      has: (...codes) => isAdmin || codes.every((c) => perms.has(c)),
      hasAny: (...codes) => isAdmin || codes.some((c) => perms.has(c)),
      isAdmin,
    };
  }, [user?.permissions, user?.role?.name]);
}
