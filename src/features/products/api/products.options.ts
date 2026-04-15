import { useMemo } from 'react';

import { useProductsQuery } from './products.queries';

export function useProductOptions() {
  const { data, isLoading } = useProductsQuery({ limit: 1000 });
  return useMemo(
    () => ({
      data: data?.data?.map((p) => ({ id: p.id, label: p.shortName ?? p.description })),
      isLoading,
    }),
    [data, isLoading]
  );
}
