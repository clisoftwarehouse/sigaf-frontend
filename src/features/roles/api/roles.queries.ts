import { useQuery } from '@tanstack/react-query';

import { fetchRole, fetchRoles } from './roles.api';

// ----------------------------------------------------------------------

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: string) => [...roleKeys.all, 'detail', id] as const,
};

export function useRolesQuery() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: fetchRoles,
    staleTime: 5 * 60_000,
  });
}

export function useRoleQuery(id: string | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? ''),
    queryFn: () => fetchRole(id as string),
    enabled: Boolean(id),
  });
}
