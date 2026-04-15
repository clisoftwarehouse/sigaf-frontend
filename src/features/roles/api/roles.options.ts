import { useMemo } from 'react';

import { useRolesQuery } from './roles.queries';

export function useRoleOptions() {
  const { data, isLoading } = useRolesQuery();
  return useMemo(
    () => ({
      data: data?.map((r) => ({ id: r.id, label: r.name ?? r.id })),
      isLoading,
    }),
    [data, isLoading]
  );
}
