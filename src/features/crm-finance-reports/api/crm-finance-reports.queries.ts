import type { FlujoCajaResult, ComportamientoResult, PacientesCronicosResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

type Params = Record<string, string | number | undefined>;

function useReportQuery<T>(key: string, url: string, params: Params) {
  return useQuery({
    queryKey: ['crm-finance-reports', key, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<T>(url, { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export const usePacientesCronicos = (params: { lookbackDays?: number }) =>
  useReportQuery<PacientesCronicosResult>('pacientes-cronicos', endpoints.crmFinanceReports.pacientesCronicos, params);
export const useComportamiento = (params: { branchId?: string }) =>
  useReportQuery<ComportamientoResult>('comportamiento', endpoints.crmFinanceReports.comportamientoClientes, params);
export const useFlujoCaja = (params: { weeks?: number; branchId?: string }) =>
  useReportQuery<FlujoCajaResult>('flujo-caja', endpoints.crmFinanceReports.flujoCaja, params);
