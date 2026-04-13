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
} from './categories.api';

// ----------------------------------------------------------------------

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

export function useCategoriesQuery() {
  const query = useQuery({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategories,
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
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
