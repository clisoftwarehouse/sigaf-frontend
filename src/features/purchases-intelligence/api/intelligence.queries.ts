import type { ProfitabilityFilters } from '../model/types';

import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import {
  listLabConditions,
  createLabCondition,
  updateLabCondition,
  deleteLabCondition,
  fetchProfitability,
  generateSuggestions,
  listClassifications,
  recalculatePortfolio,
  comparatorForProduct,
  listDrugstoreConditions,
  createDrugstoreCondition,
  updateDrugstoreCondition,
  deleteDrugstoreCondition,
  createOrdersFromSuggestions,
} from './intelligence.api';

export const intelligenceKeys = {
  all: ['purchases-intelligence'] as const,
  conditionsDrugstore: (filters?: Record<string, unknown>) =>
    [...intelligenceKeys.all, 'conditions', 'drugstore', filters] as const,
  conditionsLab: (filters?: Record<string, unknown>) =>
    [...intelligenceKeys.all, 'conditions', 'lab', filters] as const,
  classifications: (filters: Record<string, unknown>) =>
    [...intelligenceKeys.all, 'classifications', filters] as const,
  comparator: (productId: string, quantity: number) =>
    [...intelligenceKeys.all, 'comparator', productId, quantity] as const,
  profitability: (filters: Record<string, unknown>) =>
    [...intelligenceKeys.all, 'profitability', filters] as const,
};

export function useProfitability(filters: ProfitabilityFilters) {
  return useQuery({
    queryKey: intelligenceKeys.profitability(filters),
    queryFn: () => fetchProfitability(filters),
  });
}

// ─── Conditions queries ─────────────────────────────────────────────

export function useDrugstoreConditions(filters?: {
  supplierId?: string;
  productId?: string;
  brandId?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: intelligenceKeys.conditionsDrugstore(filters),
    queryFn: () => listDrugstoreConditions(filters),
    staleTime: 60_000,
  });
}

export function useLabConditions(filters?: {
  brandId?: string;
  supplierId?: string;
  productId?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: intelligenceKeys.conditionsLab(filters),
    queryFn: () => listLabConditions(filters),
    staleTime: 60_000,
  });
}

// ─── Condition mutations ────────────────────────────────────────────

export function useCreateDrugstoreCondition(
  options?: UseMutationOptions<Awaited<ReturnType<typeof createDrugstoreCondition>>, Error, Parameters<typeof createDrugstoreCondition>[0]>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDrugstoreCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'conditions', 'drugstore'] });
    },
    ...options,
  });
}

export function useUpdateDrugstoreCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Parameters<typeof updateDrugstoreCondition>[1] }) =>
      updateDrugstoreCondition(args.id, args.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'conditions', 'drugstore'] });
    },
  });
}

export function useDeleteDrugstoreCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDrugstoreCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'conditions', 'drugstore'] });
    },
  });
}

export function useCreateLabCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLabCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'conditions', 'lab'] });
    },
  });
}

export function useUpdateLabCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Parameters<typeof updateLabCondition>[1] }) =>
      updateLabCondition(args.id, args.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'conditions', 'lab'] });
    },
  });
}

export function useDeleteLabCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLabCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'conditions', 'lab'] });
    },
  });
}

// ─── Classifications ────────────────────────────────────────────────

export function useClassifications(filters: {
  branchId: string;
  abcd?: 'A' | 'B' | 'C' | 'D';
  isPareto?: boolean;
}) {
  return useQuery({
    queryKey: intelligenceKeys.classifications(filters),
    queryFn: () => listClassifications(filters),
    enabled: !!filters.branchId,
    staleTime: 30_000,
  });
}

export function useRecalculatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recalculatePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...intelligenceKeys.all, 'classifications'] });
    },
  });
}

// ─── Suggestions ────────────────────────────────────────────────────

export function useGenerateSuggestions() {
  return useMutation({
    mutationFn: generateSuggestions,
  });
}

export function useCreateOrdersFromSuggestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrdersFromSuggestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

// ─── Comparator ─────────────────────────────────────────────────────

export function useComparatorForProduct(productId: string | null, quantity: number) {
  return useQuery({
    queryKey: intelligenceKeys.comparator(productId ?? '', quantity),
    queryFn: () => comparatorForProduct(productId!, quantity),
    enabled: !!productId && quantity > 0,
    staleTime: 30_000,
  });
}
