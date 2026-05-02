import type {
  AmountRuleInput,
  CategoryRuleInput,
  CreateBranchGroupPayload,
  UpdateBranchGroupPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  setAmountRules,
  fetchBranchGroup,
  setCategoryRules,
  fetchBranchGroups,
  createBranchGroup,
  updateBranchGroup,
  deleteBranchGroup,
  assignBranchesToBranchGroup,
} from './branch-groups.api';

// ----------------------------------------------------------------------

export const branchGroupKeys = {
  all: ['branch-groups'] as const,
  list: (filters: { search?: string; isActive?: boolean }) =>
    [...branchGroupKeys.all, 'list', filters] as const,
  detail: (id: string) => [...branchGroupKeys.all, 'detail', id] as const,
};

export function useBranchGroupsQuery(filters: { search?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: branchGroupKeys.list(filters),
    queryFn: () => fetchBranchGroups(filters),
  });
}

export function useBranchGroupQuery(id: string | undefined) {
  return useQuery({
    queryKey: branchGroupKeys.detail(id ?? ''),
    queryFn: () => fetchBranchGroup(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateBranchGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchGroupPayload) => createBranchGroup(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: branchGroupKeys.all }),
  });
}

export function useUpdateBranchGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchGroupPayload }) =>
      updateBranchGroup(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: branchGroupKeys.all });
      qc.invalidateQueries({ queryKey: branchGroupKeys.detail(id) });
    },
  });
}

export function useDeleteBranchGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBranchGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: branchGroupKeys.all }),
  });
}

export function useSetAmountRulesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      branchGroupId,
      rules,
    }: {
      branchGroupId: string;
      rules: AmountRuleInput[];
    }) => setAmountRules(branchGroupId, rules),
    onSuccess: (_data, { branchGroupId }) => {
      qc.invalidateQueries({ queryKey: branchGroupKeys.detail(branchGroupId) });
    },
  });
}

export function useSetCategoryRulesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      branchGroupId,
      rules,
    }: {
      branchGroupId: string;
      rules: CategoryRuleInput[];
    }) => setCategoryRules(branchGroupId, rules),
    onSuccess: (_data, { branchGroupId }) => {
      qc.invalidateQueries({ queryKey: branchGroupKeys.detail(branchGroupId) });
    },
  });
}

export function useAssignBranchesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ branchGroupId, branchIds }: { branchGroupId: string; branchIds: string[] }) =>
      assignBranchesToBranchGroup(branchGroupId, branchIds),
    onSuccess: (_data, { branchGroupId }) => {
      qc.invalidateQueries({ queryKey: branchGroupKeys.all });
      qc.invalidateQueries({ queryKey: branchGroupKeys.detail(branchGroupId) });
      // Las branches también cambiaron de grupo — invalida sus queries.
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}
