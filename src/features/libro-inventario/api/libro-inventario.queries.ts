import type { LibroInventarioParams, LibroInventarioResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export const libroInventarioKeys = {
  report: (params: LibroInventarioParams) => ['libro-inventario', params] as const,
};

export function useLibroInventario(params: LibroInventarioParams) {
  return useQuery({
    queryKey: libroInventarioKeys.report(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get<LibroInventarioResult>(endpoints.libroInventario.root, {
        params,
      });
      return data;
    },
    staleTime: 60_000,
  });
}
