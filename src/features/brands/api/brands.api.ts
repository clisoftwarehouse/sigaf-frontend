import type { Brand, BrandFilters, CreateBrandPayload, UpdateBrandPayload } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchBrands(filters: BrandFilters = {}): Promise<Brand[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.isLaboratory !== undefined) params.isLaboratory = String(filters.isLaboratory);
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);

  const res = await axios.get<Brand[]>(endpoints.brands.root, { params });
  return res.data;
}

export async function fetchBrand(id: string): Promise<Brand> {
  const res = await axios.get<Brand>(endpoints.brands.byId(id));
  return res.data;
}

export async function createBrand(payload: CreateBrandPayload): Promise<Brand> {
  const res = await axios.post<Brand>(endpoints.brands.root, payload);
  return res.data;
}

export async function updateBrand(id: string, payload: UpdateBrandPayload): Promise<Brand> {
  const res = await axios.put<Brand>(endpoints.brands.byId(id), payload);
  return res.data;
}

export async function deleteBrand(id: string): Promise<void> {
  await axios.delete(endpoints.brands.byId(id));
}

export async function restoreBrand(id: string): Promise<Brand> {
  const res = await axios.patch<Brand>(`${endpoints.brands.byId(id)}/restore`);
  return res.data;
}
