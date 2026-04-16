import type { Permission } from '@/features/permissions/model/types';

export type Role = {
  id: string;
  name?: string;
  description?: string | null;
  permissions?: Permission[];
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  permissionIds?: string[];
};

export type UpdateRolePayload = Partial<CreateRolePayload>;
