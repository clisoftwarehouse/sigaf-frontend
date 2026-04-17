import type {
  Promotion,
  PromotionScope,
  PromotionFilters,
  PaginatedResponse,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  CreatePromotionScopePayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchPromotions(
  filters: PromotionFilters = {}
): Promise<PaginatedResponse<Promotion>> {
  const params: Record<string, string> = {};
  if (filters.type) params.type = filters.type;
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  if (filters.activeAt) params.activeAt = filters.activeAt;
  if (filters.includeExpired !== undefined) params.includeExpired = String(filters.includeExpired);
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 100);
  const res = await axios.get<PaginatedResponse<Promotion>>(endpoints.promotions.root, { params });
  return res.data;
}

export async function fetchPromotion(id: string): Promise<Promotion> {
  const res = await axios.get<Promotion>(endpoints.promotions.byId(id));
  return res.data;
}

export async function createPromotion(payload: CreatePromotionPayload): Promise<Promotion> {
  const res = await axios.post<Promotion>(endpoints.promotions.root, payload);
  return res.data;
}

export async function updatePromotion(
  id: string,
  payload: UpdatePromotionPayload
): Promise<Promotion> {
  const res = await axios.put<Promotion>(endpoints.promotions.byId(id), payload);
  return res.data;
}

export async function activatePromotion(id: string): Promise<Promotion> {
  const res = await axios.post<Promotion>(endpoints.promotions.activate(id));
  return res.data;
}

export async function deactivatePromotion(id: string): Promise<Promotion> {
  const res = await axios.post<Promotion>(endpoints.promotions.deactivate(id));
  return res.data;
}

export async function deletePromotion(id: string): Promise<void> {
  await axios.delete(endpoints.promotions.byId(id));
}

export async function addPromotionScope(
  id: string,
  payload: CreatePromotionScopePayload
): Promise<PromotionScope> {
  const res = await axios.post<PromotionScope>(endpoints.promotions.scopes(id), payload);
  return res.data;
}

export async function removePromotionScope(id: string, scopeId: string): Promise<void> {
  await axios.delete(endpoints.promotions.scopeById(id, scopeId));
}
