import type { VariacionResult, NivelServicioResult, SaldosProveedorResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

type Params = Record<string, string | undefined>;

function useReportQuery<T>(key: string, url: string, params: Params) {
  return useQuery({
    queryKey: ['purchase-reports', key, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<T>(url, { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export const useVariacion = (params: { from?: string; to?: string; branchId?: string }) =>
  useReportQuery<VariacionResult>('variacion', endpoints.purchaseReports.variacionPrecios, params);
export const useNivelServicio = (params: { from?: string; to?: string; branchId?: string }) =>
  useReportQuery<NivelServicioResult>('nivel-servicio', endpoints.purchaseReports.nivelServicio, params);
export const useSaldosProveedores = (params: { branchId?: string }) =>
  useReportQuery<SaldosProveedorResult>('saldos', endpoints.purchaseReports.saldosProveedores, params);
