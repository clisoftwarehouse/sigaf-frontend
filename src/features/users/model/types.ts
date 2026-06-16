import type { Role } from '@/features/roles/model/types';

// ----------------------------------------------------------------------

export type SigafUser = {
  id: string;
  username: string;
  fullName: string;
  cedula: string | null;
  email: string | null;
  phone: string | null;
  role?: Role | null;
  /**
   * Permission codes del rol del usuario (ej. `products.create`, `pos.void`).
   * El backend los adjunta en `/auth/me` para que el frontend (admin y POS)
   * filtre la UI sin requests adicionales. Lista vacía = sin permisos (caso
   * usuario recién creado sin rol). Se refresca con cada hidratación de /me.
   */
  permissions?: string[];
  /** Sucursales donde puede iniciar sesión (vacío/ausente = todas). QA 153. */
  authorizedBranches?: { id: string; name?: string }[];
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserPayload = {
  username: string;
  password: string;
  fullName: string;
  cedula?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: { id: string } | null;
  authorizedBranchIds?: string[];
};

export type UpdateUserPayload = {
  password?: string;
  fullName?: string;
  cedula?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: { id: string } | null;
  isActive?: boolean;
  authorizedBranchIds?: string[];
};

export type UserFilters = {
  roleId?: string;
  isActive?: boolean;
};

export type InfinityPaginationResponse<T> = {
  data: T[];
  hasNextPage: boolean;
};
