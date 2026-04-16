import type {
  GoodsReceipt,
  PurchaseOrder,
  PaginatedResponse,
  GoodsReceiptFilters,
  PurchaseOrderFilters,
  CreateGoodsReceiptPayload,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ─── Orders ─────────────────────────────────────────────────────────────

function buildOrdersParams(filters: PurchaseOrderFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.supplierId) params.supplierId = filters.supplierId;
  if (filters.status) params.status = filters.status;
  if (filters.orderType) params.orderType = filters.orderType;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  return params;
}

export async function fetchOrders(
  filters: PurchaseOrderFilters = {}
): Promise<PaginatedResponse<PurchaseOrder>> {
  const res = await axios.get<PaginatedResponse<PurchaseOrder>>(endpoints.purchases.orders, {
    params: buildOrdersParams(filters),
  });
  return res.data;
}

export async function fetchOrder(id: string): Promise<PurchaseOrder> {
  const res = await axios.get<PurchaseOrder>(endpoints.purchases.orderById(id));
  return res.data;
}

export async function createOrder(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
  const res = await axios.post<PurchaseOrder>(endpoints.purchases.orders, payload);
  return res.data;
}

export async function updateOrder(
  id: string,
  payload: UpdatePurchaseOrderPayload
): Promise<PurchaseOrder> {
  const res = await axios.put<PurchaseOrder>(endpoints.purchases.orderById(id), payload);
  return res.data;
}

export async function approveOrder(id: string): Promise<PurchaseOrder> {
  const res = await axios.put<PurchaseOrder>(endpoints.purchases.approveOrder(id), {});
  return res.data;
}

// ─── Receipts ───────────────────────────────────────────────────────────

export async function fetchReceipts(
  filters: GoodsReceiptFilters = {}
): Promise<PaginatedResponse<GoodsReceipt>> {
  const res = await axios.get<PaginatedResponse<GoodsReceipt>>(endpoints.purchases.receipts, {
    params: filters,
  });
  return res.data;
}

export async function fetchReceipt(id: string): Promise<GoodsReceipt> {
  const res = await axios.get<GoodsReceipt>(endpoints.purchases.receiptById(id));
  return res.data;
}

export async function createReceipt(payload: CreateGoodsReceiptPayload): Promise<GoodsReceipt> {
  const res = await axios.post<GoodsReceipt>(endpoints.purchases.receipts, payload);
  return res.data;
}
