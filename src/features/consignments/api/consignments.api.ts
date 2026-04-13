import type {
  ConsignmentEntry,
  ConsignmentReturn,
  PaginatedResponse,
  ConsignmentFilters,
  ConsignmentLiquidation,
  CreateConsignmentEntryPayload,
  CreateConsignmentReturnPayload,
  CreateConsignmentLiquidationPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

function buildEntriesParams(filters: ConsignmentFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.supplierId) params.supplierId = filters.supplierId;
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  return params;
}

// ─── Entries ────────────────────────────────────────────────────────────

export async function fetchEntries(
  filters: ConsignmentFilters = {}
): Promise<PaginatedResponse<ConsignmentEntry>> {
  const res = await axios.get<PaginatedResponse<ConsignmentEntry>>(
    endpoints.consignments.entries,
    { params: buildEntriesParams(filters) }
  );
  return res.data;
}

export async function fetchEntry(id: string): Promise<ConsignmentEntry> {
  const res = await axios.get<ConsignmentEntry>(endpoints.consignments.entryById(id));
  return res.data;
}

export async function createEntry(
  payload: CreateConsignmentEntryPayload
): Promise<ConsignmentEntry> {
  const res = await axios.post<ConsignmentEntry>(endpoints.consignments.entries, payload);
  return res.data;
}

// ─── Returns ────────────────────────────────────────────────────────────

export async function fetchReturns(params: {
  branchId?: string;
  supplierId?: string;
  consignmentEntryId?: string;
}): Promise<ConsignmentReturn[]> {
  const res = await axios.get<ConsignmentReturn[]>(endpoints.consignments.returns, { params });
  return res.data;
}

export async function createReturn(
  payload: CreateConsignmentReturnPayload
): Promise<ConsignmentReturn> {
  const res = await axios.post<ConsignmentReturn>(endpoints.consignments.returns, payload);
  return res.data;
}

// ─── Liquidations ──────────────────────────────────────────────────────

export async function fetchLiquidations(params: {
  branchId?: string;
  supplierId?: string;
  status?: string;
}): Promise<ConsignmentLiquidation[]> {
  const res = await axios.get<ConsignmentLiquidation[]>(endpoints.consignments.liquidations, {
    params,
  });
  return res.data;
}

export async function fetchLiquidation(id: string): Promise<ConsignmentLiquidation> {
  const res = await axios.get<ConsignmentLiquidation>(
    endpoints.consignments.liquidationById(id)
  );
  return res.data;
}

export async function createLiquidation(
  payload: CreateConsignmentLiquidationPayload
): Promise<ConsignmentLiquidation> {
  const res = await axios.post<ConsignmentLiquidation>(
    endpoints.consignments.liquidations,
    payload
  );
  return res.data;
}

export async function approveLiquidation(id: string): Promise<ConsignmentLiquidation> {
  const res = await axios.put<ConsignmentLiquidation>(
    endpoints.consignments.approveLiquidation(id),
    {}
  );
  return res.data;
}
