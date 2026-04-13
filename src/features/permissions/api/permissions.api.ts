import type { Permission, PermissionFilters } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchPermissions(filters: PermissionFilters = {}): Promise<Permission[]> {
  const params: Record<string, string> = {};
  if (filters.module) params.module = filters.module;
  const res = await axios.get<Permission[]>(endpoints.permissions.root, { params });
  return res.data;
}
