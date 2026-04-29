import { useMemo } from 'react';

import { useTherapeuticUsesQuery } from './therapeutic-uses.queries';

export function useTherapeuticUseOptions() {
  const { data, isLoading } = useTherapeuticUsesQuery();
  return useMemo(
    () => ({
      data: data?.map((t) => ({
        id: t.id,
        label: t.name,
        secondaryLabel: t.atcCode ?? null,
      })),
      isLoading,
    }),
    [data, isLoading]
  );
}
