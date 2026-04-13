import type { AuthState, SigafUser } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from '@/shared/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isSessionValid } from './utils';

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

  const status = state.loading ? 'loading' : state.user ? 'authenticated' : 'unauthenticated';

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
