export type Role = {
  id: number | string;
  name?: string;
};

export type SigafUser = {
  id: string;
  username: string;
  fullName: string;
  cedula: string | null;
  email: string | null;
  phone: string | null;
  role?: Role | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // UI helpers derived in the auth provider
  displayName?: string;
  photoURL?: string;
};

export type AuthState = {
  user: SigafUser | null;
  loading: boolean;
};

export type AuthContextValue = {
  user: SigafUser | null;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};
