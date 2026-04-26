import type {
  ClaimFilters,
  SupplierClaim,
  PaginatedResponse,
  CreateClaimPayload,
  UpdateClaimPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

function buildParams(filters: ClaimFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.supplierId) params.supplierId = filters.supplierId;
  if (filters.receiptId) params.receiptId = filters.receiptId;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.claimType) params.claimType = filters.claimType;
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  return params;
}

export async function fetchClaims(
  filters: ClaimFilters = {}
): Promise<PaginatedResponse<SupplierClaim>> {
  const res = await axios.get<PaginatedResponse<SupplierClaim>>(endpoints.claims.root, {
    params: buildParams(filters),
  });
  return res.data;
}

export async function fetchClaim(id: string): Promise<SupplierClaim> {
  const res = await axios.get<SupplierClaim>(endpoints.claims.byId(id));
  return res.data;
}

export async function createClaim(payload: CreateClaimPayload): Promise<SupplierClaim> {
  const res = await axios.post<SupplierClaim>(endpoints.claims.root, payload);
  return res.data;
}

export async function updateClaim(
  id: string,
  payload: UpdateClaimPayload
): Promise<SupplierClaim> {
  const res = await axios.put<SupplierClaim>(endpoints.claims.byId(id), payload);
  return res.data;
}
