import type {
  Prescription,
  PrescriptionFilters,
  PrescriptionsListResponse,
  CreatePrescriptionPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchPrescriptions(
  filters: PrescriptionFilters = {}
): Promise<PrescriptionsListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.customerId) params.customerId = filters.customerId;
  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const res = await axios.get<PrescriptionsListResponse>(endpoints.prescriptions.root, { params });
  return res.data;
}

export async function fetchPrescription(id: string): Promise<Prescription> {
  const res = await axios.get<Prescription>(endpoints.prescriptions.byId(id));
  return res.data;
}

export async function createPrescription(payload: CreatePrescriptionPayload): Promise<Prescription> {
  const res = await axios.post<Prescription>(endpoints.prescriptions.root, payload);
  return res.data;
}

export async function cancelPrescription(id: string): Promise<Prescription> {
  const res = await axios.post<Prescription>(endpoints.prescriptions.cancel(id));
  return res.data;
}
