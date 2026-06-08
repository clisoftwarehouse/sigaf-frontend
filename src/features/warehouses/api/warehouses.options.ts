import { useMemo } from 'react';

import { useWarehousesQuery } from './warehouses.queries';

export function useWarehouseOptions(branchId?: string) {
  const { data, isLoading } = useWarehousesQuery(branchId ? { branchId } : {});
  return useMemo(
    () => ({
      data: data?.map((w) => ({
        id: w.id,
        label: w.name ?? w.locationCode,
        branchId: w.branchId,
        isQuarantine: w.isQuarantine,
        isForSale: w.isForSale,
        isForPurchase: w.isForPurchase,
      })),
      isLoading,
    }),
    [data, isLoading]
  );
}
