import { useQuery } from '@tanstack/react-query';

import { fetchSaleTicket } from './sales.api';

// ----------------------------------------------------------------------

export const saleKeys = {
  all: ['sales'] as const,
  detail: (id: string) => [...saleKeys.all, 'detail', id] as const,
};

export function useSaleTicketQuery(id: string | undefined) {
  return useQuery({
    queryKey: saleKeys.detail(id ?? ''),
    queryFn: () => fetchSaleTicket(id as string),
    enabled: !!id,
  });
}
