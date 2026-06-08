import type {
  Warehouse,
  WarehouseFilters,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchWarehouses(
  filters: WarehouseFilters = {}
): Promise<Warehouse[]> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.isQuarantine !== undefined) params.isQuarantine = String(filters.isQuarantine);
  if (filters.isForSale !== undefined) params.isForSale = String(filters.isForSale);
  if (filters.isForPurchase !== undefined) params.isForPurchase = String(filters.isForPurchase);
  const res = await axios.get<Warehouse[]>(endpoints.warehouses.root, { params });
  return res.data;
}

export async function fetchWarehouse(id: string): Promise<Warehouse> {
  const res = await axios.get<Warehouse>(endpoints.warehouses.byId(id));
  return res.data;
}

export async function createWarehouse(
  payload: CreateWarehousePayload
): Promise<Warehouse> {
  const res = await axios.post<Warehouse>(endpoints.warehouses.root, payload);
  return res.data;
}

export async function updateWarehouse(
  id: string,
  payload: UpdateWarehousePayload
): Promise<Warehouse> {
  const res = await axios.put<Warehouse>(endpoints.warehouses.byId(id), payload);
  return res.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await axios.delete(endpoints.warehouses.byId(id));
}
