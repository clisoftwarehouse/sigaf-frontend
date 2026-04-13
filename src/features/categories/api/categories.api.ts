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

export async function fetchCategories(): Promise<CategoryListResponse> {
  const res = await axios.get<CategoryListResponse>(endpoints.categories.root);
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

export async function deleteCategory(id: string): Promise<void> {
  await axios.delete(endpoints.categories.byId(id));
}
