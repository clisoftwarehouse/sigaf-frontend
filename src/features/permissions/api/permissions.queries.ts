import type { PermissionFilters } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import { fetchPermissions } from './permissions.api';

// ----------------------------------------------------------------------

export const permissionKeys = {
  all: ['permissions'] as const,
  list: (filters: PermissionFilters) => [...permissionKeys.all, 'list', filters] as const,
};

export function usePermissionsQuery(filters: PermissionFilters = {}) {
  return useQuery({
    queryKey: permissionKeys.list(filters),
    queryFn: () => fetchPermissions(filters),
    staleTime: 5 * 60_000,
  });
}
