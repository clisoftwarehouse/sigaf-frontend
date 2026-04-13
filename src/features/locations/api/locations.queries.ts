import type { LocationFilters, CreateLocationPayload, UpdateLocationPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchLocation,
  createLocation,
  deleteLocation,
  fetchLocations,
  updateLocation,
} from './locations.api';

// ----------------------------------------------------------------------

export const locationKeys = {
  all: ['locations'] as const,
  list: (filters: LocationFilters) => [...locationKeys.all, 'list', filters] as const,
  detail: (id: string) => [...locationKeys.all, 'detail', id] as const,
};

export function useLocationsQuery(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: locationKeys.list(filters),
    queryFn: () => fetchLocations(filters),
  });
}

export function useLocationQuery(id: string | undefined) {
  return useQuery({
    queryKey: locationKeys.detail(id ?? ''),
    queryFn: () => fetchLocation(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => createLocation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all }),
  });
}

export function useUpdateLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLocationPayload }) =>
      updateLocation(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: locationKeys.all });
      qc.invalidateQueries({ queryKey: locationKeys.detail(id) });
    },
  });
}

export function useDeleteLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all }),
  });
}
