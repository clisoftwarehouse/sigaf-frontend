import { useMemo } from 'react';

import { useLocationsQuery } from './locations.queries';

export function useLocationOptions(branchId?: string) {
  const { data, isLoading } = useLocationsQuery(branchId ? { branchId } : {});
  return useMemo(
    () => ({
      data: data?.map((l) => ({
        id: l.id,
        label: l.locationCode,
        branchId: l.branchId,
        isQuarantine: l.isQuarantine,
      })),
      isLoading,
    }),
    [data, isLoading]
  );
}
