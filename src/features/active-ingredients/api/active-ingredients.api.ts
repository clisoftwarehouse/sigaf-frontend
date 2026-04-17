import type {
  ActiveIngredient,
  VademecumDetails,
  VademecumCandidate,
  ActiveIngredientFilters,
  CreateActiveIngredientPayload,
  UpdateActiveIngredientPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchActiveIngredients(
  filters: ActiveIngredientFilters = {}
): Promise<ActiveIngredient[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.atcCode) params.atcCode = filters.atcCode;
  const res = await axios.get<ActiveIngredient[]>(endpoints.activeIngredients.root, { params });
  return res.data;
}

export async function fetchActiveIngredient(id: string): Promise<ActiveIngredient> {
  const res = await axios.get<ActiveIngredient>(endpoints.activeIngredients.byId(id));
  return res.data;
}

export async function createActiveIngredient(
  payload: CreateActiveIngredientPayload
): Promise<ActiveIngredient> {
  const res = await axios.post<ActiveIngredient>(endpoints.activeIngredients.root, payload);
  return res.data;
}

export async function updateActiveIngredient(
  id: string,
  payload: UpdateActiveIngredientPayload
): Promise<ActiveIngredient> {
  const res = await axios.put<ActiveIngredient>(endpoints.activeIngredients.byId(id), payload);
  return res.data;
}

export async function deleteActiveIngredient(id: string): Promise<void> {
  await axios.delete(endpoints.activeIngredients.byId(id));
}

export async function vademecumLookup(q: string, limit = 10): Promise<VademecumCandidate[]> {
  const res = await axios.get<VademecumCandidate[]>(endpoints.activeIngredients.vademecumLookup, {
    params: { q, limit },
  });
  return res.data;
}

export async function vademecumDetails(q: string, index = 0): Promise<VademecumDetails> {
  const res = await axios.get<VademecumDetails>(endpoints.activeIngredients.vademecumDetails, {
    params: { q, index },
  });
  return res.data;
}

export async function vademecumImport(q: string, index = 0): Promise<ActiveIngredient> {
  const res = await axios.post<ActiveIngredient>(endpoints.activeIngredients.vademecumImport, {
    q,
    index,
  });
  return res.data;
}
