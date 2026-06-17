import type {
  MermaResult,
  RiesgoResult,
  ParetoResult,
  DiasInventarioResult,
  TransferenciasResult,
  CapitalEstancadoResult,
} from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

type AnyParams = Record<string, string | number | undefined>;

function useReportQuery<T>(key: string, url: string, params: AnyParams) {
  return useQuery({
    queryKey: ['inventory-reports', key, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<T>(url, { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export const useRiesgo = (params: { branchId?: string; horizonDays?: number }) =>
  useReportQuery<RiesgoResult>('riesgo', endpoints.inventoryReports.riesgo, params);

export const useMerma = (params: { from?: string; to?: string; branchId?: string }) =>
  useReportQuery<MermaResult>('merma', endpoints.inventoryReports.merma, params);

export const useDiasInventario = (params: { branchId?: string; windowDays?: number }) =>
  useReportQuery<DiasInventarioResult>('dias-inventario', endpoints.inventoryReports.diasInventario, params);

export const useCapitalEstancado = (params: { branchId?: string; minDays?: number }) =>
  useReportQuery<CapitalEstancadoResult>('capital-estancado', endpoints.inventoryReports.capitalEstancado, params);

export const usePareto = (params: { from?: string; to?: string; branchId?: string }) =>
  useReportQuery<ParetoResult>('pareto', endpoints.inventoryReports.pareto, params);

export const useTransferencias = (params: { from?: string; to?: string; branchId?: string; status?: string }) =>
  useReportQuery<TransferenciasResult>('transferencias', endpoints.inventoryReports.transferencias, params);
