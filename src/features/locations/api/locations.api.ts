import type {
  LocationFilters,
  WarehouseLocation,
  CreateLocationPayload,
  UpdateLocationPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchLocations(
  filters: LocationFilters = {}
): Promise<WarehouseLocation[]> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.isQuarantine !== undefined) params.isQuarantine = String(filters.isQuarantine);
  const res = await axios.get<WarehouseLocation[]>(endpoints.locations.root, { params });
  return res.data;
}

export async function fetchLocation(id: string): Promise<WarehouseLocation> {
  const res = await axios.get<WarehouseLocation>(endpoints.locations.byId(id));
  return res.data;
}

export async function createLocation(
  payload: CreateLocationPayload
): Promise<WarehouseLocation> {
  const res = await axios.post<WarehouseLocation>(endpoints.locations.root, payload);
  return res.data;
}

export async function updateLocation(
  id: string,
  payload: UpdateLocationPayload
): Promise<WarehouseLocation> {
  const res = await axios.put<WarehouseLocation>(endpoints.locations.byId(id), payload);
  return res.data;
}

export async function deleteLocation(id: string): Promise<void> {
  await axios.delete(endpoints.locations.byId(id));
}
