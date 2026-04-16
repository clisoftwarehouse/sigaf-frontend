import type {
  InventoryCount,
  CyclicSchedule,
  AccuracyFilters,
  AccuracyMetrics,
  InventoryCountItem,
  InventoryCountFilters,
  CyclicScheduleFilters,
  InventoryCountListResponse,
  CreateInventoryCountPayload,
  CreateCyclicSchedulePayload,
  UpdateCyclicSchedulePayload,
} from '../model/counts-types';

import axios from '@/shared/lib/axios';

// ----------------------------------------------------------------------

const ROOT = '/v1/inventory';

// ----------------------------------------------------------------------
// Counts

export async function fetchCounts(
  filters: InventoryCountFilters = {}
): Promise<InventoryCountListResponse> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.countType) params.countType = filters.countType;
  if (filters.status) params.status = filters.status;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 1000);
  const res = await axios.get<InventoryCountListResponse>(`${ROOT}/counts`, { params });
  return res.data;
}

export async function fetchCount(id: string): Promise<InventoryCount> {
  const res = await axios.get<InventoryCount>(`${ROOT}/counts/${id}`);
  return res.data;
}

export async function createCount(payload: CreateInventoryCountPayload): Promise<InventoryCount> {
  const res = await axios.post<InventoryCount>(`${ROOT}/counts`, payload);
  return res.data;
}

export async function startCount(id: string): Promise<InventoryCount> {
  const res = await axios.put<InventoryCount>(`${ROOT}/counts/${id}/start`, {});
  return res.data;
}

export async function updateCountItem(
  countId: string,
  itemId: string,
  countedQuantity: number
): Promise<InventoryCountItem> {
  const res = await axios.put<InventoryCountItem>(
    `${ROOT}/counts/${countId}/items/${itemId}`,
    { countedQuantity }
  );
  return res.data;
}

export async function bulkUpdateCountItems(
  countId: string,
  items: { itemId: string; countedQuantity: number }[]
): Promise<void> {
  await axios.put(`${ROOT}/counts/${countId}/items`, { items });
}

export async function recountCountItem(
  countId: string,
  itemId: string,
  recountReason: string
): Promise<InventoryCountItem> {
  const res = await axios.put<InventoryCountItem>(
    `${ROOT}/counts/${countId}/items/${itemId}/recount`,
    { recountReason }
  );
  return res.data;
}

export async function completeCount(id: string): Promise<InventoryCount> {
  const res = await axios.post<InventoryCount>(`${ROOT}/counts/${id}/complete`, {});
  return res.data;
}

export async function approveCount(id: string, justification: string): Promise<InventoryCount> {
  const res = await axios.post<InventoryCount>(`${ROOT}/counts/${id}/approve`, { justification });
  return res.data;
}

export async function cancelCount(id: string, reason: string): Promise<InventoryCount> {
  const res = await axios.post<InventoryCount>(`${ROOT}/counts/${id}/cancel`, { reason });
  return res.data;
}

// ----------------------------------------------------------------------
// Cyclic schedules

export async function fetchCyclicSchedules(
  filters: CyclicScheduleFilters = {}
): Promise<CyclicSchedule[]> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  const res = await axios.get<CyclicSchedule[]>(`${ROOT}/counts/cyclic-schedules`, { params });
  return res.data;
}

export async function createCyclicSchedule(
  payload: CreateCyclicSchedulePayload
): Promise<CyclicSchedule> {
  const res = await axios.post<CyclicSchedule>(`${ROOT}/counts/cyclic-schedules`, payload);
  return res.data;
}

export async function updateCyclicSchedule(
  id: string,
  payload: UpdateCyclicSchedulePayload
): Promise<CyclicSchedule> {
  const res = await axios.put<CyclicSchedule>(`${ROOT}/counts/cyclic-schedules/${id}`, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// Accuracy

export async function fetchAccuracy(filters: AccuracyFilters = {}): Promise<AccuracyMetrics> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  const res = await axios.get<AccuracyMetrics>(`${ROOT}/counts/accuracy`, { params });
  return res.data;
}
