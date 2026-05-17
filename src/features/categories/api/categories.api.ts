import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

/**
 * Backend may return either a flat list or a nested tree (`children` populated).
 * The hook normalises both shapes downstream.
 */
export type CategoryListResponse = Category[] | CategoryTreeRaw[];

type CategoryTreeRaw = Category & { children?: CategoryTreeRaw[] };

export async function fetchCategories(filter?: { isActive?: boolean }): Promise<CategoryListResponse> {
  const params: Record<string, string> = {};
  if (filter?.isActive !== undefined) params.isActive = String(filter.isActive);
  const res = await axios.get<CategoryListResponse>(endpoints.categories.root, { params });
  return res.data;
}

export async function fetchCategory(id: string): Promise<Category> {
  const res = await axios.get<Category>(endpoints.categories.byId(id));
  return res.data;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await axios.post<Category>(endpoints.categories.root, payload);
  return res.data;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<Category> {
  const res = await axios.put<Category>(endpoints.categories.byId(id), payload);
  return res.data;
}

export async function deleteCategory(id: string, options: { cascade?: boolean } = {}): Promise<void> {
  await axios.delete(endpoints.categories.byId(id), {
    params: options.cascade ? { cascade: 'true' } : undefined,
  });
}

export async function fetchActiveDescendantsCount(id: string): Promise<number> {
  const res = await axios.get<{ count: number }>(
    `${endpoints.categories.byId(id)}/active-descendants-count`
  );
  return res.data.count;
}

export async function restoreCategory(id: string): Promise<Category> {
  const res = await axios.patch<Category>(`${endpoints.categories.byId(id)}/restore`);
  return res.data;
}
