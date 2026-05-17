import type { CreateCategoryPayload, UpdateCategoryPayload } from '../model/types';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { buildCategoryTree, flattenCategoryTree } from '../model/tree';
import {
  fetchCategory,
  createCategory,
  deleteCategory,
  updateCategory,
  fetchCategories,
  restoreCategory,
  fetchActiveDescendantsCount,
} from './categories.api';

// ----------------------------------------------------------------------

export const categoryKeys = {
  all: ['categories'] as const,
  list: (filter?: { isActive?: boolean }) => [...categoryKeys.all, 'list', filter] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

export function useCategoriesQuery(filter?: { isActive?: boolean }) {
  const query = useQuery({
    queryKey: categoryKeys.list(filter),
    queryFn: () => fetchCategories(filter),
  });

  const tree = useMemo(() => (query.data ? buildCategoryTree(query.data) : []), [query.data]);
  const flat = useMemo(() => flattenCategoryTree(tree), [tree]);

  return { ...query, tree, flat };
}

export function useCategoryQuery(id: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ''),
    queryFn: () => fetchCategory(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      updateCategory(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: categoryKeys.detail(id) });
    },
  });
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      deleteCategory(id, { cascade }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useActiveDescendantsCountQuery(id: string | null) {
  return useQuery({
    queryKey: [...categoryKeys.all, 'active-descendants-count', id ?? ''] as const,
    queryFn: () => fetchActiveDescendantsCount(id as string),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

export function useRestoreCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
