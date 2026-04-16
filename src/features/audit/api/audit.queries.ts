import type { AuditLogFilters } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import { fetchAuditLog } from './audit.api';

// ----------------------------------------------------------------------

export const auditKeys = {
  all: ['audit-log'] as const,
  list: (filters: AuditLogFilters) => [...auditKeys.all, 'list', filters] as const,
};

export function useAuditLogQuery(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => fetchAuditLog(filters),
  });
}
