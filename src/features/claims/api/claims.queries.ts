import type { ClaimFilters, CreateClaimPayload, UpdateClaimPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchClaim, fetchClaims, createClaim, updateClaim } from './claims.api';

export const claimKeys = {
  all: ['claims'] as const,
  list: (filters: ClaimFilters) => [...claimKeys.all, 'list', filters] as const,
  detail: (id: string) => [...claimKeys.all, 'detail', id] as const,
};

export function useClaimsQuery(filters: ClaimFilters = {}) {
  return useQuery({
    queryKey: claimKeys.list(filters),
    queryFn: () => fetchClaims(filters),
  });
}

export function useClaimQuery(id: string | undefined) {
  return useQuery({
    queryKey: claimKeys.detail(id ?? ''),
    queryFn: () => fetchClaim(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateClaimMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => createClaim(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: claimKeys.all }),
  });
}

export function useUpdateClaimMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClaimPayload }) =>
      updateClaim(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: claimKeys.all });
      qc.invalidateQueries({ queryKey: claimKeys.detail(id) });
    },
  });
}
