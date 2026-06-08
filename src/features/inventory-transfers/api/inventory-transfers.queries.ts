import type {
  TransferFilters,
  CreateTransferPayload,
  CancelTransferPayload,
  ReceiveTransferPayload,
  CreateFromReceiptPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchTransfer,
  fetchTransfers,
  cancelTransfer,
  createTransfer,
  receiveTransfer,
  dispatchTransfer,
  createTransferFromReceipt,
} from './inventory-transfers.api';

// ----------------------------------------------------------------------

export const transferKeys = {
  all: ['inventory-transfers'] as const,
  list: (filters: TransferFilters) => [...transferKeys.all, 'list', filters] as const,
  detail: (id: string) => [...transferKeys.all, 'detail', id] as const,
};

export function useTransfersQuery(filters: TransferFilters = {}) {
  return useQuery({
    queryKey: transferKeys.list(filters),
    queryFn: () => fetchTransfers(filters),
  });
}

export function useTransferQuery(id: string | undefined) {
  return useQuery({
    queryKey: transferKeys.detail(id ?? ''),
    queryFn: () => fetchTransfer(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => createTransfer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: transferKeys.all }),
  });
}

export function useCreateTransferFromReceiptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ receiptId, payload }: { receiptId: string; payload: CreateFromReceiptPayload }) =>
      createTransferFromReceipt(receiptId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: transferKeys.all }),
  });
}

export function useDispatchTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dispatchTransfer(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: transferKeys.all });
      qc.invalidateQueries({ queryKey: transferKeys.detail(id) });
    },
  });
}

export function useReceiveTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReceiveTransferPayload }) =>
      receiveTransfer(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: transferKeys.all });
      qc.invalidateQueries({ queryKey: transferKeys.detail(id) });
    },
  });
}

export function useCancelTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelTransferPayload }) =>
      cancelTransfer(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: transferKeys.all });
      qc.invalidateQueries({ queryKey: transferKeys.detail(id) });
    },
  });
}
