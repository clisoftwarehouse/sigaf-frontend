import type { ControladosResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export const controladosKeys = {
  report: (year: number, month: number, branchId?: string) =>
    ['controlados', year, month, branchId ?? null] as const,
};

export function useControlados(year: number, month: number, branchId?: string) {
  return useQuery({
    queryKey: controladosKeys.report(year, month, branchId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<ControladosResult>(endpoints.controlados.root, {
        params: { year, month, branchId },
      });
      return data;
    },
    staleTime: 60_000,
  });
}
