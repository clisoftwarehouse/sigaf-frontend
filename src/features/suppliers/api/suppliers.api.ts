import type {
  Supplier,
  SupplierFilters,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.isDrugstore !== undefined) params.isDrugstore = String(filters.isDrugstore);
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  const res = await axios.get<Supplier[]>(endpoints.suppliers.root, { params });
  return res.data;
}

export async function fetchSupplier(id: string): Promise<Supplier> {
  const res = await axios.get<Supplier>(endpoints.suppliers.byId(id));
  return res.data;
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
  const res = await axios.post<Supplier>(endpoints.suppliers.root, payload);
  return res.data;
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierPayload
): Promise<Supplier> {
  const res = await axios.put<Supplier>(endpoints.suppliers.byId(id), payload);
  return res.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await axios.delete(endpoints.suppliers.byId(id));
}
