import type { PrescriberInput, PrescriberFilters } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getPrescriber,
  listPrescribers,
  createPrescriber,
  updatePrescriber,
  deactivatePrescriber,
} from './prescribers.api';

export const prescribersKeys = {
  all: ['prescribers'] as const,
  list: (filters: PrescriberFilters) => [...prescribersKeys.all, 'list', filters] as const,
  detail: (id: string) => [...prescribersKeys.all, 'detail', id] as const,
};

export function usePrescribersList(filters: PrescriberFilters) {
  return useQuery({
    queryKey: prescribersKeys.list(filters),
    queryFn: () => listPrescribers(filters),
    staleTime: 30_000,
  });
}

export function usePrescriber(id: string | null) {
  return useQuery({
    queryKey: prescribersKeys.detail(id ?? ''),
    queryFn: () => getPrescriber(id!),
    enabled: !!id,
  });
}

export function useCreatePrescriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPrescriber,
    onSuccess: () => qc.invalidateQueries({ queryKey: prescribersKeys.all }),
  });
}

export function useUpdatePrescriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PrescriberInput }) =>
      updatePrescriber(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: prescribersKeys.all }),
  });
}

export function useDeactivatePrescriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivatePrescriber,
    onSuccess: () => qc.invalidateQueries({ queryKey: prescribersKeys.all }),
  });
}
