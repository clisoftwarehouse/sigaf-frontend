import type { PrescriptionFilters, CreatePrescriptionPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchPrescription,
  createPrescription,
  cancelPrescription,
  fetchPrescriptions,
} from './prescriptions.api';

// ----------------------------------------------------------------------

export const prescriptionKeys = {
  all: ['prescriptions'] as const,
  list: (filters: PrescriptionFilters) => [...prescriptionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...prescriptionKeys.all, 'detail', id] as const,
};

export function usePrescriptionsQuery(filters: PrescriptionFilters = {}) {
  return useQuery({
    queryKey: prescriptionKeys.list(filters),
    queryFn: () => fetchPrescriptions(filters),
  });
}

export function usePrescriptionQuery(id: string | undefined) {
  return useQuery({
    queryKey: prescriptionKeys.detail(id ?? ''),
    queryFn: () => fetchPrescription(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePrescriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) => createPrescription(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prescriptionKeys.all });
    },
  });
}

export function useCancelPrescriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPrescription(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: prescriptionKeys.all });
      qc.invalidateQueries({ queryKey: prescriptionKeys.detail(id) });
    },
  });
}
