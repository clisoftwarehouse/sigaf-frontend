import type {
  ActiveIngredientFilters,
  CreateActiveIngredientPayload,
  UpdateActiveIngredientPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  vademecumLookup,
  vademecumImport,
  vademecumDetails,
  fetchActiveIngredient,
  createActiveIngredient,
  deleteActiveIngredient,
  fetchActiveIngredients,
  updateActiveIngredient,
} from './active-ingredients.api';

// ----------------------------------------------------------------------

export const activeIngredientKeys = {
  all: ['active-ingredients'] as const,
  list: (filters: ActiveIngredientFilters) =>
    [...activeIngredientKeys.all, 'list', filters] as const,
  detail: (id: string) => [...activeIngredientKeys.all, 'detail', id] as const,
};

export function useActiveIngredientsQuery(filters: ActiveIngredientFilters = {}) {
  return useQuery({
    queryKey: activeIngredientKeys.list(filters),
    queryFn: () => fetchActiveIngredients(filters),
  });
}

export function useActiveIngredientQuery(id: string | undefined) {
  return useQuery({
    queryKey: activeIngredientKeys.detail(id ?? ''),
    queryFn: () => fetchActiveIngredient(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateActiveIngredientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateActiveIngredientPayload) => createActiveIngredient(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activeIngredientKeys.all });
    },
  });
}

export function useUpdateActiveIngredientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateActiveIngredientPayload }) =>
      updateActiveIngredient(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: activeIngredientKeys.all });
      qc.invalidateQueries({ queryKey: activeIngredientKeys.detail(id) });
    },
  });
}

export function useDeleteActiveIngredientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActiveIngredient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activeIngredientKeys.all });
    },
  });
}

export function useVademecumLookupMutation() {
  return useMutation({
    mutationFn: ({ q, limit }: { q: string; limit?: number }) => vademecumLookup(q, limit),
  });
}

export function useVademecumDetailsMutation() {
  return useMutation({
    mutationFn: ({ q, index }: { q: string; index?: number }) => vademecumDetails(q, index),
  });
}

export function useVademecumImportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ q, index }: { q: string; index?: number }) => vademecumImport(q, index),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activeIngredientKeys.all });
    },
  });
}
