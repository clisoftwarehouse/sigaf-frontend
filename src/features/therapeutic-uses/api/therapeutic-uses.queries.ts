import type {
  TherapeuticUseFilters,
  CreateTherapeuticUsePayload,
  UpdateTherapeuticUsePayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchTherapeuticUse,
  createTherapeuticUse,
  deleteTherapeuticUse,
  fetchTherapeuticUses,
  updateTherapeuticUse,
} from './therapeutic-uses.api';

// ----------------------------------------------------------------------

export const therapeuticUseKeys = {
  all: ['therapeutic-uses'] as const,
  list: (filters: TherapeuticUseFilters) =>
    [...therapeuticUseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...therapeuticUseKeys.all, 'detail', id] as const,
};

export function useTherapeuticUsesQuery(filters: TherapeuticUseFilters = {}) {
  return useQuery({
    queryKey: therapeuticUseKeys.list(filters),
    queryFn: () => fetchTherapeuticUses(filters),
  });
}

export function useTherapeuticUseQuery(id: string | undefined) {
  return useQuery({
    queryKey: therapeuticUseKeys.detail(id ?? ''),
    queryFn: () => fetchTherapeuticUse(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTherapeuticUseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTherapeuticUsePayload) => createTherapeuticUse(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: therapeuticUseKeys.all });
    },
  });
}

export function useUpdateTherapeuticUseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTherapeuticUsePayload }) =>
      updateTherapeuticUse(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: therapeuticUseKeys.all });
      qc.invalidateQueries({ queryKey: therapeuticUseKeys.detail(id) });
    },
  });
}

export function useDeleteTherapeuticUseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTherapeuticUse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: therapeuticUseKeys.all });
    },
  });
}
