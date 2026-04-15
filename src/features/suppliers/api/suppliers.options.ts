import { useMemo } from 'react';

import { useSuppliersQuery } from './suppliers.queries';

export function useSupplierOptions() {
  const { data, isLoading } = useSuppliersQuery({ isActive: true });
  return useMemo(
    () => ({
      data: data?.map((s) => ({ id: s.id, label: s.businessName })),
      isLoading,
    }),
    [data, isLoading]
  );
}
