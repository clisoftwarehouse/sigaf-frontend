import type {
  Price,
  PriceFilters,
  ResolvedPrice,
  PaginatedResponse,
  CreatePricePayload,
  UpdatePricePayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchPrices(filters: PriceFilters = {}): Promise<PaginatedResponse<Price>> {
  const params: Record<string, string> = {};
  if (filters.productId) params.productId = filters.productId;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.activeAt) params.activeAt = filters.activeAt;
  if (filters.includeHistory !== undefined) params.includeHistory = String(filters.includeHistory);
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 50);
  const res = await axios.get<PaginatedResponse<Price>>(endpoints.prices.root, { params });
  return res.data;
}

export async function fetchPrice(id: string): Promise<Price> {
  const res = await axios.get<Price>(endpoints.prices.byId(id));
  return res.data;
}

export async function createPrice(payload: CreatePricePayload): Promise<Price> {
  const res = await axios.post<Price>(endpoints.prices.root, payload);
  return res.data;
}

export async function updatePrice(id: string, payload: UpdatePricePayload): Promise<Price> {
  const res = await axios.put<Price>(endpoints.prices.byId(id), payload);
  return res.data;
}

export async function expirePrice(id: string): Promise<Price> {
  const res = await axios.post<Price>(endpoints.prices.expire(id));
  return res.data;
}

export async function fetchCurrentPrice(params: {
  productId: string;
  branchId?: string;
  at?: string;
}): Promise<ResolvedPrice> {
  const res = await axios.get<ResolvedPrice>(endpoints.prices.current, { params });
  return res.data;
}
