import type {
  ConsignmentFilters,
  CreateConsignmentEntryPayload,
  CreateConsignmentReturnPayload,
  CreateConsignmentLiquidationPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchEntry,
  createEntry,
  fetchEntries,
  createReturn,
  fetchReturns,
  fetchLiquidation,
  createLiquidation,
  fetchLiquidations,
  approveLiquidation,
} from './consignments.api';

// ----------------------------------------------------------------------

export const consignmentKeys = {
  all: ['consignments'] as const,
  entries: (filters: ConsignmentFilters) =>
    [...consignmentKeys.all, 'entries', filters] as const,
  entry: (id: string) => [...consignmentKeys.all, 'entry', id] as const,
  returns: (params: object) => [...consignmentKeys.all, 'returns', params] as const,
  liquidations: (params: object) =>
    [...consignmentKeys.all, 'liquidations', params] as const,
  liquidation: (id: string) => [...consignmentKeys.all, 'liquidation', id] as const,
};

// ─── Entries ────────────────────────────────────────────────────────────

export function useEntriesQuery(filters: ConsignmentFilters = {}) {
  return useQuery({
    queryKey: consignmentKeys.entries(filters),
    queryFn: () => fetchEntries(filters),
  });
}

export function useEntryQuery(id: string | undefined) {
  return useQuery({
    queryKey: consignmentKeys.entry(id ?? ''),
    queryFn: () => fetchEntry(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateEntryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConsignmentEntryPayload) => createEntry(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: consignmentKeys.all }),
  });
}

// ─── Returns ────────────────────────────────────────────────────────────

export function useReturnsQuery(params: {
  branchId?: string;
  supplierId?: string;
  consignmentEntryId?: string;
}) {
  return useQuery({
    queryKey: consignmentKeys.returns(params),
    queryFn: () => fetchReturns(params),
  });
}

export function useCreateReturnMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConsignmentReturnPayload) => createReturn(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: consignmentKeys.all }),
  });
}

// ─── Liquidations ──────────────────────────────────────────────────────

export function useLiquidationsQuery(params: {
  branchId?: string;
  supplierId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: consignmentKeys.liquidations(params),
    queryFn: () => fetchLiquidations(params),
  });
}

export function useLiquidationQuery(id: string | undefined) {
  return useQuery({
    queryKey: consignmentKeys.liquidation(id ?? ''),
    queryFn: () => fetchLiquidation(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateLiquidationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConsignmentLiquidationPayload) => createLiquidation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: consignmentKeys.all }),
  });
}

export function useApproveLiquidationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveLiquidation(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: consignmentKeys.all });
      qc.invalidateQueries({ queryKey: consignmentKeys.liquidation(id) });
    },
  });
}
