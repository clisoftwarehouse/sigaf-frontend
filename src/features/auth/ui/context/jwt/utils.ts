import axios from '@/shared/lib/axios';

import {
  JWT_STORAGE_KEY,
  JWT_EXPIRES_AT_KEY,
  JWT_REFRESH_STORAGE_KEY,
  SESSION_EXPIRED_REASON_KEY,
} from './constant';

// ----------------------------------------------------------------------

export type SessionTokens = {
  token: string;
  refreshToken?: string;
  /** Absolute expiration timestamp in milliseconds (matches backend `tokenExpires`). */
  tokenExpires?: number;
};

export function isSessionValid(): boolean {
  const token = localStorage.getItem(JWT_STORAGE_KEY);
  if (!token) return false;

  const expiresAt = Number(localStorage.getItem(JWT_EXPIRES_AT_KEY) ?? 0);
  if (!expiresAt) return true;
  return expiresAt > Date.now();
}

export function setSession(tokens: SessionTokens | null) {
  if (!tokens) {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
    localStorage.removeItem(JWT_EXPIRES_AT_KEY);
    delete axios.defaults.headers.common.Authorization;
    return;
  }

  localStorage.setItem(JWT_STORAGE_KEY, tokens.token);
  if (tokens.refreshToken) {
    localStorage.setItem(JWT_REFRESH_STORAGE_KEY, tokens.refreshToken);
  }
  if (tokens.tokenExpires) {
    localStorage.setItem(JWT_EXPIRES_AT_KEY, String(tokens.tokenExpires));
  }
  // Tras un login exitoso, descartamos cualquier banner residual de sesión expirada.
  localStorage.removeItem(SESSION_EXPIRED_REASON_KEY);
  axios.defaults.headers.common.Authorization = `Bearer ${tokens.token}`;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(JWT_REFRESH_STORAGE_KEY);
}
