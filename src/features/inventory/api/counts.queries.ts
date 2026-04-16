import type {
  InventoryCountFilters,
  CyclicScheduleFilters,
  CreateInventoryCountPayload,
  CreateCyclicSchedulePayload,
  UpdateCyclicSchedulePayload,
} from '../model/counts-types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchCount,
  startCount,
  createCount,
  fetchCounts,
  cancelCount,
  approveCount,
  completeCount,
  updateCountItem,
  recountCountItem,
  bulkUpdateCountItems,
  fetchCyclicSchedules,
  createCyclicSchedule,
  updateCyclicSchedule,
} from './counts.api';

// ----------------------------------------------------------------------

export const countKeys = {
  all: ['inventory-counts'] as const,
  list: (filters: InventoryCountFilters) => [...countKeys.all, 'list', filters] as const,
  detail: (id: string) => [...countKeys.all, 'detail', id] as const,
  schedules: (filters: CyclicScheduleFilters) =>
    ['inventory-cyclic-schedules', filters] as const,
};

// ----------------------------------------------------------------------
// Counts queries

export function useCountsQuery(filters: InventoryCountFilters = {}) {
  return useQuery({
    queryKey: countKeys.list(filters),
    queryFn: () => fetchCounts(filters),
  });
}

export function useCountQuery(id: string | undefined) {
  return useQuery({
    queryKey: countKeys.detail(id ?? ''),
    queryFn: () => fetchCount(id as string),
    enabled: Boolean(id),
  });
}

// ----------------------------------------------------------------------
// Counts mutations

export function useCreateCountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInventoryCountPayload) => createCount(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: countKeys.all }),
  });
}

export function useStartCountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startCount(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: countKeys.all });
      qc.invalidateQueries({ queryKey: countKeys.detail(id) });
    },
  });
}

export function useUpdateCountItemMutation(countId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, countedQuantity }: { itemId: string; countedQuantity: number }) =>
      updateCountItem(countId, itemId, countedQuantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: countKeys.detail(countId) }),
  });
}

export function useBulkUpdateCountItemsMutation(countId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { itemId: string; countedQuantity: number }[]) =>
      bulkUpdateCountItems(countId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: countKeys.detail(countId) }),
  });
}

export function useRecountCountItemMutation(countId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) =>
      recountCountItem(countId, itemId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: countKeys.detail(countId) }),
  });
}

export function useCompleteCountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeCount(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: countKeys.all });
      qc.invalidateQueries({ queryKey: countKeys.detail(id) });
    },
  });
}

export function useApproveCountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      approveCount(id, justification),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: countKeys.all });
      qc.invalidateQueries({ queryKey: countKeys.detail(id) });
    },
  });
}

export function useCancelCountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelCount(id, reason),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: countKeys.all });
      qc.invalidateQueries({ queryKey: countKeys.detail(id) });
    },
  });
}

// ----------------------------------------------------------------------
// Cyclic schedules

export function useCyclicSchedulesQuery(filters: CyclicScheduleFilters = {}) {
  return useQuery({
    queryKey: countKeys.schedules(filters),
    queryFn: () => fetchCyclicSchedules(filters),
  });
}

export function useCreateCyclicScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCyclicSchedulePayload) => createCyclicSchedule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-cyclic-schedules'] }),
  });
}

export function useUpdateCyclicScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCyclicSchedulePayload }) =>
      updateCyclicSchedule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-cyclic-schedules'] }),
  });
}
