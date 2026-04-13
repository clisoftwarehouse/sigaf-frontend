import type { TerminalFilters, CreateTerminalPayload, UpdateTerminalPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchTerminal,
  createTerminal,
  deleteTerminal,
  fetchTerminals,
  updateTerminal,
} from './terminals.api';

// ----------------------------------------------------------------------

export const terminalKeys = {
  all: ['terminals'] as const,
  list: (filters: TerminalFilters) => [...terminalKeys.all, 'list', filters] as const,
  detail: (id: string) => [...terminalKeys.all, 'detail', id] as const,
};

export function useTerminalsQuery(filters: TerminalFilters = {}) {
  return useQuery({
    queryKey: terminalKeys.list(filters),
    queryFn: () => fetchTerminals(filters),
  });
}

export function useTerminalQuery(id: string | undefined) {
  return useQuery({
    queryKey: terminalKeys.detail(id ?? ''),
    queryFn: () => fetchTerminal(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTerminalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTerminalPayload) => createTerminal(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: terminalKeys.all }),
  });
}

export function useUpdateTerminalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTerminalPayload }) =>
      updateTerminal(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: terminalKeys.all });
      qc.invalidateQueries({ queryKey: terminalKeys.detail(id) });
    },
  });
}

export function useDeleteTerminalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTerminal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: terminalKeys.all }),
  });
}
