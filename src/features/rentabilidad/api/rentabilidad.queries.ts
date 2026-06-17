import type { RentabilidadParams, RentabilidadResult } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export const rentabilidadKeys = {
  report: (params: RentabilidadParams) => ['rentabilidad', params] as const,
};

export function useRentabilidad(params: RentabilidadParams) {
  return useQuery({
    queryKey: rentabilidadKeys.report(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get<RentabilidadResult>(endpoints.rentabilidad.root, {
        params,
      });
      return data;
    },
    staleTime: 60_000,
  });
}
