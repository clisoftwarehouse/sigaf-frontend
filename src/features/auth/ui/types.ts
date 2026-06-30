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
  /**
   * Permission codes asignados al rol del usuario. Lo adjunta el backend en
   * `/auth/me` (e implícitamente en el login response). El frontend lo usa
   * para gating de UI vía `usePermissions()`.
   */
  permissions?: string[];
  /**
   * Sucursales donde el usuario puede operar (de `/auth/me`). Vacío/ausente =
   * sin restricción (todas). Lo usa el BranchScope para aislar la UI por sucursal.
   */
  authorizedBranches?: { id: string; name?: string }[];
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
