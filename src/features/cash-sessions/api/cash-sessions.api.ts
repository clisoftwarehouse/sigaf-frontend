import type {
  XReport,
  ZReport,
  CashSession,
  CashSessionFilters,
  OpenCashSessionPayload,
  CloseCashSessionPayload,
  CashSessionsListResponse,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchCashSessions(
  filters: CashSessionFilters = {}
): Promise<CashSessionsListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.terminalId) params.terminalId = filters.terminalId;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  const res = await axios.get<CashSessionsListResponse>(endpoints.cashSessions.root, { params });
  return res.data;
}

export async function fetchCashSession(id: string): Promise<CashSession> {
  const res = await axios.get<CashSession>(endpoints.cashSessions.byId(id));
  return res.data;
}

export async function fetchCurrentCashSession(terminalId: string): Promise<CashSession | null> {
  const res = await axios.get<CashSession | null>(endpoints.cashSessions.current, {
    params: { terminalId },
  });
  return res.data;
}

export async function openCashSession(payload: OpenCashSessionPayload): Promise<CashSession> {
  const res = await axios.post<CashSession>(endpoints.cashSessions.open, payload);
  return res.data;
}

export async function closeCashSession(
  id: string,
  payload: CloseCashSessionPayload
): Promise<CashSession> {
  const res = await axios.post<CashSession>(endpoints.cashSessions.close(id), payload);
  return res.data;
}

export async function fetchXReport(id: string): Promise<XReport> {
  const res = await axios.get<XReport>(endpoints.cashSessions.xReport(id));
  return res.data;
}

export async function fetchZReport(id: string): Promise<ZReport> {
  const res = await axios.get<ZReport>(endpoints.cashSessions.zReport(id));
  return res.data;
}
