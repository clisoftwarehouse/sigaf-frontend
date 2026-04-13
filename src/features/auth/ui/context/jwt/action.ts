import type { SigafUser } from '../../types';

import axios, { endpoints } from '@/shared/lib/axios';

import { setSession } from './utils';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: SigafUser;
};

export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  const res = await axios.post<LoginResponse>(endpoints.auth.login, { email, password });

  const { token, refreshToken, tokenExpires } = res.data;
  if (!token) {
    throw new Error('La respuesta del servidor no contiene un token de acceso');
  }

  setSession({ token, refreshToken, tokenExpires });
};

export const signOut = async (): Promise<void> => {
  try {
    await axios.post(endpoints.auth.logout);
  } catch (error) {
    // Ignore: even if the server call fails, we want to clear the local session.
    console.warn('Logout backend call failed, clearing session anyway:', error);
  } finally {
    setSession(null);
  }
};
