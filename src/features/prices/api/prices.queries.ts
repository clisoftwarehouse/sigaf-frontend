import type { PriceFilters, CreatePricePayload, UpdatePricePayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchPrice,
  createPrice,
  updatePrice,
  expirePrice,
  fetchPrices,
  fetchCurrentPrice,
  fetchEffectivePrice,
  fetchRevaluationFactor,
} from './prices.api';

// ----------------------------------------------------------------------

export const priceKeys = {
  all: ['prices'] as const,
  list: (filters: PriceFilters) => [...priceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...priceKeys.all, 'detail', id] as const,
  current: (productId: string, branchId?: string) =>
    [...priceKeys.all, 'current', productId, branchId ?? ''] as const,
  effective: (productId: string, branchId?: string) =>
    [...priceKeys.all, 'effective', productId, branchId ?? ''] as const,
  revaluationFactor: () => [...priceKeys.all, 'revaluation-factor'] as const,
};

export function usePricesQuery(filters: PriceFilters = {}) {
  return useQuery({
    queryKey: priceKeys.list(filters),
    queryFn: () => fetchPrices(filters),
  });
}

export function usePriceQuery(id: string | undefined) {
  return useQuery({
    queryKey: priceKeys.detail(id ?? ''),
    queryFn: () => fetchPrice(id as string),
    enabled: Boolean(id),
  });
}

export function useCurrentPriceQuery(params: {
  productId: string | undefined;
  branchId?: string;
}) {
  return useQuery({
    queryKey: priceKeys.current(params.productId ?? '', params.branchId),
    queryFn: () => fetchCurrentPrice({ productId: params.productId as string, branchId: params.branchId }),
    enabled: Boolean(params.productId),
  });
}

export function useCreatePriceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePricePayload) => createPrice(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: priceKeys.all }),
  });
}

export function useUpdatePriceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePricePayload }) =>
      updatePrice(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: priceKeys.all });
      qc.invalidateQueries({ queryKey: priceKeys.detail(id) });
    },
  });
}

export function useExpirePriceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expirePrice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: priceKeys.all }),
  });
}

export function useEffectivePriceQuery(params: {
  productId: string | undefined;
  branchId?: string;
}) {
  return useQuery({
    queryKey: priceKeys.effective(params.productId ?? '', params.branchId),
    queryFn: () =>
      fetchEffectivePrice({ productId: params.productId as string, branchId: params.branchId }),
    enabled: Boolean(params.productId),
  });
}

export function useRevaluationFactorQuery() {
  return useQuery({
    queryKey: priceKeys.revaluationFactor(),
    queryFn: () => fetchRevaluationFactor(),
    staleTime: 60_000,
  });
}
