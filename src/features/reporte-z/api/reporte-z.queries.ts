import type { ReporteZRow } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export const reporteZKeys = {
  list: (from: string, to: string, branchId?: string) =>
    ['reporte-z', 'list', from, to, branchId ?? null] as const,
};

/** Cierres Z en un rango de fechas (inclusive). */
export function useReporteZ(from: string, to: string, branchId?: string) {
  return useQuery({
    queryKey: reporteZKeys.list(from, to, branchId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<ReporteZRow[]>(endpoints.fiscalZReports.root, {
        params: { from, to, branchId },
      });
      return data;
    },
    staleTime: 60_000,
  });
}
