import type {
  CashSessionFilters,
  OpenCashSessionPayload,
  CloseCashSessionPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchXReport,
  fetchZReport,
  openCashSession,
  closeCashSession,
  fetchCashSession,
  fetchCashSessions,
  fetchCurrentCashSession,
} from './cash-sessions.api';

// ----------------------------------------------------------------------

export const cashSessionKeys = {
  all: ['cash-sessions'] as const,
  list: (filters: CashSessionFilters) => [...cashSessionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...cashSessionKeys.all, 'detail', id] as const,
  current: (terminalId: string) => [...cashSessionKeys.all, 'current', terminalId] as const,
  xReport: (id: string) => [...cashSessionKeys.all, 'x-report', id] as const,
  zReport: (id: string) => [...cashSessionKeys.all, 'z-report', id] as const,
};

export function useCashSessionsQuery(filters: CashSessionFilters = {}) {
  return useQuery({
    queryKey: cashSessionKeys.list(filters),
    queryFn: () => fetchCashSessions(filters),
  });
}

export function useCashSessionQuery(id: string | undefined) {
  return useQuery({
    queryKey: cashSessionKeys.detail(id ?? ''),
    queryFn: () => fetchCashSession(id as string),
    enabled: Boolean(id),
  });
}

export function useCurrentCashSessionQuery(terminalId: string | undefined) {
  return useQuery({
    queryKey: cashSessionKeys.current(terminalId ?? ''),
    queryFn: () => fetchCurrentCashSession(terminalId as string),
    enabled: Boolean(terminalId),
    staleTime: 10_000,
  });
}

export function useXReportQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: cashSessionKeys.xReport(id ?? ''),
    queryFn: () => fetchXReport(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useZReportQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: cashSessionKeys.zReport(id ?? ''),
    queryFn: () => fetchZReport(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useOpenCashSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenCashSessionPayload) => openCashSession(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cashSessionKeys.all });
    },
  });
}

export function useCloseCashSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CloseCashSessionPayload }) =>
      closeCashSession(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cashSessionKeys.all });
      qc.invalidateQueries({ queryKey: cashSessionKeys.detail(id) });
    },
  });
}
