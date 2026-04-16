import type { CreateRolePayload, UpdateRolePayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchRole, createRole, fetchRoles, updateRole } from './roles.api';

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

export function useCreateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      qc.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}
