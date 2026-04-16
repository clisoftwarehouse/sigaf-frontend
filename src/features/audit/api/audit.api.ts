import type { AuditLogFilters, AuditLogResponse } from '../model/types';

import axios from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
  const params: Record<string, string> = {};
  if (filters.tableName) params.tableName = filters.tableName;
  if (filters.recordId) params.recordId = filters.recordId;
  if (filters.action) params.action = filters.action;
  if (filters.userId) params.userId = filters.userId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 1000);

  const res = await axios.get<AuditLogResponse>('/v1/audit-log', { params });
  return res.data;
}
