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
};

export type UpdateUserPayload = {
  password?: string;
  fullName?: string;
  cedula?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: { id: string } | null;
  isActive?: boolean;
};

export type UserFilters = {
  roleId?: string;
  isActive?: boolean;
};

export type InfinityPaginationResponse<T> = {
  data: T[];
  hasNextPage: boolean;
};
