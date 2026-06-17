import type {
  ReporteXResult,
  DevolucionesResult,
  ProductividadResult,
  TransaccionesResult,
  TicketPromedioResult,
} from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

type RangeParams = { from?: string; to?: string; branchId?: string };

function useReportQuery<T>(key: string, url: string, params: RangeParams) {
  return useQuery({
    queryKey: ['sales-reports', key, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<T>(url, { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export const useReporteX = (params: RangeParams) =>
  useReportQuery<ReporteXResult>('reporte-x', endpoints.salesReports.reporteX, params);
export const useDevoluciones = (params: RangeParams) =>
  useReportQuery<DevolucionesResult>('devoluciones', endpoints.salesReports.devoluciones, params);
export const useTransacciones = (params: RangeParams) =>
  useReportQuery<TransaccionesResult>('transacciones', endpoints.salesReports.transacciones, params);
export const useTicketPromedio = (params: RangeParams) =>
  useReportQuery<TicketPromedioResult>('ticket-promedio', endpoints.salesReports.ticketPromedio, params);
export const useProductividad = (params: RangeParams) =>
  useReportQuery<ProductividadResult>('productividad', endpoints.salesReports.productividad, params);
