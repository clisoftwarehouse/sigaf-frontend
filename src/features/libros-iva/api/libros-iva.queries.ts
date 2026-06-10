import type { LibroVentasResult, LibroComprasResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export const librosIvaKeys = {
  ventas: (year: number, month: number, branchId?: string) =>
    ['libros-iva', 'ventas', year, month, branchId ?? null] as const,
  compras: (year: number, month: number, branchId?: string) =>
    ['libros-iva', 'compras', year, month, branchId ?? null] as const,
};

export function useLibroVentas(year: number, month: number, branchId?: string) {
  return useQuery({
    queryKey: librosIvaKeys.ventas(year, month, branchId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<LibroVentasResult>(endpoints.librosIva.ventas, {
        params: { year, month, branchId },
      });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useLibroCompras(year: number, month: number, branchId?: string) {
  return useQuery({
    queryKey: librosIvaKeys.compras(year, month, branchId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<LibroComprasResult>(endpoints.librosIva.compras, {
        params: { year, month, branchId },
      });
      return data;
    },
    staleTime: 60_000,
  });
}
