import type {
  GoodsReceiptFilters,
  PurchaseOrderFilters,
  CreateGoodsReceiptPayload,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchOrder,
  fetchOrders,
  createOrder,
  updateOrder,
  approveOrder,
  fetchReceipt,
  fetchReceipts,
  createReceipt,
} from './purchases.api';

// ----------------------------------------------------------------------

export const purchaseKeys = {
  all: ['purchases'] as const,
  orders: (filters: PurchaseOrderFilters) => [...purchaseKeys.all, 'orders', filters] as const,
  order: (id: string) => [...purchaseKeys.all, 'order', id] as const,
  receipts: (filters: GoodsReceiptFilters) =>
    [...purchaseKeys.all, 'receipts', filters] as const,
  receipt: (id: string) => [...purchaseKeys.all, 'receipt', id] as const,
};

// ─── Orders ─────────────────────────────────────────────────────────────

export function useOrdersQuery(filters: PurchaseOrderFilters = {}) {
  return useQuery({
    queryKey: purchaseKeys.orders(filters),
    queryFn: () => fetchOrders(filters),
  });
}

export function useOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: purchaseKeys.order(id ?? ''),
    queryFn: () => fetchOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) => createOrder(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function useUpdateOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePurchaseOrderPayload }) =>
      updateOrder(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all });
      qc.invalidateQueries({ queryKey: purchaseKeys.order(id) });
    },
  });
}

export function useApproveOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveOrder(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all });
      qc.invalidateQueries({ queryKey: purchaseKeys.order(id) });
    },
  });
}

// ─── Receipts ───────────────────────────────────────────────────────────

export function useReceiptsQuery(filters: GoodsReceiptFilters = {}) {
  return useQuery({
    queryKey: purchaseKeys.receipts(filters),
    queryFn: () => fetchReceipts(filters),
  });
}

export function useReceiptQuery(id: string | undefined) {
  return useQuery({
    queryKey: purchaseKeys.receipt(id ?? ''),
    queryFn: () => fetchReceipt(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateReceiptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoodsReceiptPayload) => createReceipt(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}
