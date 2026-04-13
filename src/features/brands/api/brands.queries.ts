import type { BrandFilters, CreateBrandPayload, UpdateBrandPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchBrand,
  createBrand,
  deleteBrand,
  fetchBrands,
  updateBrand,
} from './brands.api';

// ----------------------------------------------------------------------

export const brandKeys = {
  all: ['brands'] as const,
  list: (filters: BrandFilters) => [...brandKeys.all, 'list', filters] as const,
  detail: (id: string) => [...brandKeys.all, 'detail', id] as const,
};

export function useBrandsQuery(filters: BrandFilters = {}) {
  return useQuery({
    queryKey: brandKeys.list(filters),
    queryFn: () => fetchBrands(filters),
  });
}

export function useBrandQuery(id: string | undefined) {
  return useQuery({
    queryKey: brandKeys.detail(id ?? ''),
    queryFn: () => fetchBrand(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBrandPayload) => createBrand(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

export function useUpdateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBrandPayload }) =>
      updateBrand(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: brandKeys.all });
      qc.invalidateQueries({ queryKey: brandKeys.detail(id) });
    },
  });
}

export function useDeleteBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}
