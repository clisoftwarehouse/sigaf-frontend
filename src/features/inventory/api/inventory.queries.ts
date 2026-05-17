import type {
  LotFilters,
  StockFilters,
  KardexFilters,
  QuarantineLotPayload,
  CreateAdjustmentPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchLot,
  fetchLots,
  fetchStock,
  fetchKardex,
  fetchStockFefo,
  setLotQuarantine,
  createAdjustment,
  fetchAverageCost,
} from './inventory.api';

// ----------------------------------------------------------------------

export const inventoryKeys = {
  all: ['inventory'] as const,
  lots: () => [...inventoryKeys.all, 'lots'] as const,
  lotsList: (filters: LotFilters) => [...inventoryKeys.lots(), 'list', filters] as const,
  lotDetail: (id: string) => [...inventoryKeys.lots(), 'detail', id] as const,
  stock: (filters: StockFilters) => [...inventoryKeys.all, 'stock', filters] as const,
  fefo: (productId?: string, branchId?: string) =>
    [...inventoryKeys.all, 'fefo', productId ?? '', branchId ?? ''] as const,
  kardex: (filters: KardexFilters) => [...inventoryKeys.all, 'kardex', filters] as const,
  averageCost: (productId: string, branchId?: string) =>
    [...inventoryKeys.all, 'average-cost', productId, branchId ?? ''] as const,
};

// ----------------------------------------------------------------------

export function useLotsQuery(filters: LotFilters = {}) {
  return useQuery({
    queryKey: inventoryKeys.lotsList(filters),
    queryFn: () => fetchLots(filters),
  });
}

export function useLotQuery(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.lotDetail(id ?? ''),
    queryFn: () => fetchLot(id as string),
    enabled: Boolean(id),
  });
}

export function useQuarantineLotMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuarantineLotPayload }) =>
      setLotQuarantine(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

// ----------------------------------------------------------------------

export function useStockQuery(filters: StockFilters = {}) {
  return useQuery({
    queryKey: inventoryKeys.stock(filters),
    queryFn: () => fetchStock(filters),
  });
}

export function useFefoQuery(productId?: string, branchId?: string) {
  return useQuery({
    queryKey: inventoryKeys.fefo(productId, branchId),
    queryFn: () => fetchStockFefo({ productId, branchId }),
    enabled: Boolean(productId || branchId),
  });
}

// ----------------------------------------------------------------------

export function useCreateAdjustmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdjustmentPayload) => createAdjustment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

// ----------------------------------------------------------------------

export function useKardexQuery(filters: KardexFilters = {}) {
  return useQuery({
    queryKey: inventoryKeys.kardex(filters),
    queryFn: () => fetchKardex(filters),
  });
}

export function useAverageCostQuery(productId: string | undefined, branchId?: string) {
  return useQuery({
    queryKey: inventoryKeys.averageCost(productId ?? '', branchId),
    queryFn: () => fetchAverageCost(productId as string, branchId),
    enabled: Boolean(productId),
    staleTime: 30_000,
  });
}
