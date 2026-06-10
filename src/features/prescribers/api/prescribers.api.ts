import type {
  Paginated,
  Prescriber,
  PrescriberInput,
  PrescriberFilters,
} from '../model/types';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export async function listPrescribers(
  filters: PrescriberFilters,
): Promise<Paginated<Prescriber>> {
  const { data } = await axiosInstance.get<Paginated<Prescriber>>(endpoints.prescribers.root, {
    params: filters,
  });
  return data;
}

export async function getPrescriber(id: string): Promise<Prescriber> {
  const { data } = await axiosInstance.get<Prescriber>(endpoints.prescribers.byId(id));
  return data;
}

export async function createPrescriber(input: PrescriberInput): Promise<Prescriber> {
  const { data } = await axiosInstance.post<Prescriber>(endpoints.prescribers.root, input);
  return data;
}

export async function updatePrescriber(id: string, input: PrescriberInput): Promise<Prescriber> {
  const { data } = await axiosInstance.put<Prescriber>(endpoints.prescribers.byId(id), input);
  return data;
}

export async function deactivatePrescriber(id: string): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.delete<{ success: boolean }>(
    endpoints.prescribers.byId(id),
  );
  return data;
}
