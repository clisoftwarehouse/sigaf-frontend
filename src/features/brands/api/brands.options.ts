import { useMemo } from 'react';

import { useBrandsQuery } from './brands.queries';

export function useBrandOptions() {
  const { data, isLoading } = useBrandsQuery();
  return useMemo(
    () => ({
      data: data?.map((b) => ({ id: b.id, label: b.name })),
      isLoading,
    }),
    [data, isLoading]
  );
}
