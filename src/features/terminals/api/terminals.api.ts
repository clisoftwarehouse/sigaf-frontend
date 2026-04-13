import type {
  Terminal,
  TerminalFilters,
  CreateTerminalPayload,
  UpdateTerminalPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchTerminals(filters: TerminalFilters = {}): Promise<Terminal[]> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  const res = await axios.get<Terminal[]>(endpoints.terminals.root, { params });
  return res.data;
}

export async function fetchTerminal(id: string): Promise<Terminal> {
  const res = await axios.get<Terminal>(endpoints.terminals.byId(id));
  return res.data;
}

export async function createTerminal(payload: CreateTerminalPayload): Promise<Terminal> {
  const res = await axios.post<Terminal>(endpoints.terminals.root, payload);
  return res.data;
}

export async function updateTerminal(
  id: string,
  payload: UpdateTerminalPayload
): Promise<Terminal> {
  const res = await axios.put<Terminal>(endpoints.terminals.byId(id), payload);
  return res.data;
}

export async function deleteTerminal(id: string): Promise<void> {
  await axios.delete(endpoints.terminals.byId(id));
}
