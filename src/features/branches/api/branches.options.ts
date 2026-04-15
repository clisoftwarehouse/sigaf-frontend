import { useMemo } from 'react';

import { useBranchesQuery } from './branches.queries';

export function useBranchOptions() {
  const { data, isLoading } = useBranchesQuery();
  return useMemo(
    () => ({
      data: data?.map((b) => ({ id: b.id, label: b.name })),
      isLoading,
    }),
    [data, isLoading]
  );
}
