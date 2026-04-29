import type { AuthState, SigafUser } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from '@/shared/lib/axios';

import { AuthContext } from '../auth-context';
import { setSession, isSessionValid } from './utils';
import { useIdleLogout } from '../../hooks/use-idle-logout';
import { JWT_STORAGE_KEY, SESSION_EXPIRED_EVENT } from './constant';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

function decorateUser(user: SigafUser): SigafUser {
  return {
    ...user,
    displayName: user.fullName ?? user.username,
  };
}

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const token = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (!token || !isSessionValid()) {
        setSession(null);
        setState({ user: null, loading: false });
        return;
      }

      // Re-attach token in case the in-memory default was lost on full reload.
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      const res = await axios.get<SigafUser>(endpoints.auth.me);
      setState({ user: decorateUser(res.data), loading: false });
    } catch (error) {
      console.error('checkUserSession failed:', error);
      setSession(null);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escucha el evento global de sesión expirada (lo dispara el axios interceptor
  // cuando un 401 no se pudo refrescar, o el hook de idle al alcanzar el timeout)
  // y limpia el estado. AuthGuard se encarga del redirect cuando ve user=null.
  useEffect(() => {
    const handleExpired = () => {
      setSession(null);
      setState({ user: null, loading: false });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [setState]);

  const status = state.loading ? 'loading' : state.user ? 'authenticated' : 'unauthenticated';

  // Solo activamos el idle timer mientras el usuario está autenticado.
  useIdleLogout(status === 'authenticated');

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
