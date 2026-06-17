import type { IgtfReportResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export const igtfKeys = {
  percepcion: (year: number, month: number, branchId?: string) =>
    ['igtf', 'percepcion', year, month, branchId ?? null] as const,
};

export function useIgtfPercepcion(year: number, month: number, branchId?: string) {
  return useQuery({
    queryKey: igtfKeys.percepcion(year, month, branchId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<IgtfReportResult>(endpoints.igtf.percepcion, {
        params: { year, month, branchId },
      });
      return data;
    },
    staleTime: 60_000,
  });
}
