import type {
  TherapeuticUse,
  TherapeuticUseFilters,
  CreateTherapeuticUsePayload,
  UpdateTherapeuticUsePayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchTherapeuticUses(
  filters: TherapeuticUseFilters = {}
): Promise<TherapeuticUse[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.atcCode) params.atcCode = filters.atcCode;
  const res = await axios.get<TherapeuticUse[]>(endpoints.therapeuticUses.root, { params });
  return res.data;
}

export async function fetchTherapeuticUse(id: string): Promise<TherapeuticUse> {
  const res = await axios.get<TherapeuticUse>(endpoints.therapeuticUses.byId(id));
  return res.data;
}

export async function createTherapeuticUse(
  payload: CreateTherapeuticUsePayload
): Promise<TherapeuticUse> {
  const res = await axios.post<TherapeuticUse>(endpoints.therapeuticUses.root, payload);
  return res.data;
}

export async function updateTherapeuticUse(
  id: string,
  payload: UpdateTherapeuticUsePayload
): Promise<TherapeuticUse> {
  const res = await axios.put<TherapeuticUse>(endpoints.therapeuticUses.byId(id), payload);
  return res.data;
}

export async function deleteTherapeuticUse(id: string): Promise<void> {
  await axios.delete(endpoints.therapeuticUses.byId(id));
}
