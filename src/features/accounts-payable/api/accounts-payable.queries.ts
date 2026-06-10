import type { CxpFilters, RegisterPaymentInput } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getCxp,
  listCxp,
  cancelCxp,
  listPayments,
  reversePayment,
  registerPayment,
  getAgingSummary,
} from './accounts-payable.api';

export const cxpKeys = {
  all: ['accounts-payable'] as const,
  list: (filters: CxpFilters) => [...cxpKeys.all, 'list', filters] as const,
  detail: (id: string) => [...cxpKeys.all, 'detail', id] as const,
  aging: (branchId?: string) => [...cxpKeys.all, 'aging', branchId] as const,
  payments: (cxpId: string) => [...cxpKeys.all, 'payments', cxpId] as const,
};

export function useCxpList(filters: CxpFilters) {
  return useQuery({
    queryKey: cxpKeys.list(filters),
    queryFn: () => listCxp(filters),
    staleTime: 30_000,
  });
}

export function useCxpDetail(id: string | null) {
  return useQuery({
    queryKey: cxpKeys.detail(id ?? ''),
    queryFn: () => getCxp(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAgingSummary(branchId?: string) {
  return useQuery({
    queryKey: cxpKeys.aging(branchId),
    queryFn: () => getAgingSummary(branchId),
    staleTime: 30_000,
  });
}

export function useCxpPayments(cxpId: string | null) {
  return useQuery({
    queryKey: cxpKeys.payments(cxpId ?? ''),
    queryFn: () => listPayments(cxpId!),
    enabled: !!cxpId,
  });
}

export function useRegisterPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cxpId, payload }: { cxpId: string; payload: RegisterPaymentInput }) =>
      registerPayment(cxpId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cxpKeys.all });
    },
  });
}

export function useReversePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      reversePayment(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cxpKeys.all });
    },
  });
}

export function useCancelCxp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelCxp(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cxpKeys.all });
    },
  });
}
