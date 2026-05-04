import type {
  LotFilters,
  KardexEntry,
  StockFilters,
  InventoryLot,
  StockSummary,
  KardexFilters,
  PaginatedResponse,
  QuarantineLotPayload,
  CreateAdjustmentPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

function buildLotParams(filters: LotFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.productId) params.productId = filters.productId;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.locationId) params.locationId = filters.locationId;
  if (filters.status) params.status = filters.status;
  if (filters.expirySignal) params.expirySignal = filters.expirySignal;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  return params;
}

export async function fetchLots(
  filters: LotFilters = {}
): Promise<PaginatedResponse<InventoryLot>> {
  const res = await axios.get<PaginatedResponse<InventoryLot>>(endpoints.inventory.lots, {
    params: buildLotParams(filters),
  });
  return res.data;
}

export async function fetchLot(id: string): Promise<InventoryLot> {
  const res = await axios.get<InventoryLot>(endpoints.inventory.lotById(id));
  return res.data;
}

export async function setLotQuarantine(
  id: string,
  payload: QuarantineLotPayload
): Promise<InventoryLot> {
  const res = await axios.put<InventoryLot>(endpoints.inventory.quarantine(id), payload);
  return res.data;
}

// ----------------------------------------------------------------------

export async function fetchStock(
  filters: StockFilters = {}
): Promise<PaginatedResponse<StockSummary>> {
  const params: Record<string, string> = {};
  if (filters.productId) params.productId = filters.productId;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.stockStatus) params.stockStatus = filters.stockStatus;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  const res = await axios.get<PaginatedResponse<StockSummary>>(endpoints.inventory.stock, {
    params,
  });
  return res.data;
}

export async function fetchStockFefo(params: {
  productId?: string;
  branchId?: string;
}): Promise<InventoryLot[]> {
  const res = await axios.get<InventoryLot[]>(endpoints.inventory.stockFefo, { params });
  return res.data;
}

// ----------------------------------------------------------------------

export async function createAdjustment(payload: CreateAdjustmentPayload): Promise<KardexEntry> {
  const res = await axios.post<KardexEntry>(endpoints.inventory.adjustments, payload);
  return res.data;
}

// ----------------------------------------------------------------------

export async function fetchKardex(
  filters: KardexFilters = {}
): Promise<PaginatedResponse<KardexEntry>> {
  const params: Record<string, string> = {};
  if (filters.productId) params.productId = filters.productId;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.lotId) params.lotId = filters.lotId;
  if (filters.movementType) params.movementType = filters.movementType;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  const res = await axios.get<PaginatedResponse<KardexEntry>>(endpoints.inventory.kardex, {
    params,
  });
  return res.data;
}
