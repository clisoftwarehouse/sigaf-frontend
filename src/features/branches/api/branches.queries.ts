import type { CreateBranchPayload, UpdateBranchPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchBranch,
  createBranch,
  deleteBranch,
  updateBranch,
  fetchBranches,
} from './branches.api';

// ----------------------------------------------------------------------

export const branchKeys = {
  all: ['branches'] as const,
  list: () => [...branchKeys.all, 'list'] as const,
  detail: (id: string) => [...branchKeys.all, 'detail', id] as const,
};

export function useBranchesQuery() {
  return useQuery({ queryKey: branchKeys.list(), queryFn: fetchBranches });
}

export function useBranchQuery(id: string | undefined) {
  return useQuery({
    queryKey: branchKeys.detail(id ?? ''),
    queryFn: () => fetchBranch(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => createBranch(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.all }),
  });
}

export function useUpdateBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      updateBranch(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: branchKeys.all });
      qc.invalidateQueries({ queryKey: branchKeys.detail(id) });
    },
  });
}

export function useDeleteBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.all }),
  });
}
