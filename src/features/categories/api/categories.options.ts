import { useMemo } from 'react';

import { useCategoriesQuery } from './categories.queries';

export function useCategoryOptions() {
  const { flat, isLoading } = useCategoriesQuery();
  return useMemo(
    () => ({
      data: flat.map((c) => ({ id: c.id, label: c.name })),
      isLoading,
    }),
    [flat, isLoading]
  );
}
