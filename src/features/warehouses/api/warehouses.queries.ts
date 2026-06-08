import type { WarehouseFilters, CreateWarehousePayload, UpdateWarehousePayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchWarehouse,
  createWarehouse,
  deleteWarehouse,
  fetchWarehouses,
  updateWarehouse,
} from './warehouses.api';

// ----------------------------------------------------------------------

export const warehouseKeys = {
  all: ['warehouses'] as const,
  list: (filters: WarehouseFilters) => [...warehouseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...warehouseKeys.all, 'detail', id] as const,
};

export function useWarehousesQuery(filters: WarehouseFilters = {}) {
  return useQuery({
    queryKey: warehouseKeys.list(filters),
    queryFn: () => fetchWarehouses(filters),
  });
}

export function useWarehouseQuery(id: string | undefined) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? ''),
    queryFn: () => fetchWarehouse(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateWarehouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouse(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}

export function useUpdateWarehouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWarehousePayload }) =>
      updateWarehouse(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      qc.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}

export function useDeleteWarehouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}
