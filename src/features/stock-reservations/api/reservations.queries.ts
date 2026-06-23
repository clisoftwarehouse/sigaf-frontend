import type { Reservation, ReservationFilters } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

async function fetchReservations(filters: ReservationFilters): Promise<Reservation[]> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.status) params.status = filters.status;
  const res = await axios.get<Reservation[]>(endpoints.reservations.root, { params });
  return res.data ?? [];
}

async function cancelReservation(id: string): Promise<Reservation> {
  const res = await axios.post<Reservation>(endpoints.reservations.cancel(id), {});
  return res.data;
}

export const reservationKeys = {
  all: ['reservations'] as const,
  list: (filters: ReservationFilters) => [...reservationKeys.all, 'list', filters] as const,
};

export function useReservationsQuery(filters: ReservationFilters) {
  return useQuery({
    queryKey: reservationKeys.list(filters),
    queryFn: () => fetchReservations(filters),
  });
}

export function useCancelReservationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}
