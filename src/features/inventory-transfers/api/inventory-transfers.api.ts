import type {
  TransferFilters,
  InventoryTransfer,
  PaginatedTransfers,
  CreateTransferPayload,
  CancelTransferPayload,
  ReceiveTransferPayload,
  CreateFromReceiptPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchTransfers(filters: TransferFilters = {}): Promise<PaginatedTransfers> {
  const params: Record<string, string> = {};
  if (filters.transferType) params.transferType = filters.transferType;
  if (filters.fromBranchId) params.fromBranchId = filters.fromBranchId;
  if (filters.toBranchId) params.toBranchId = filters.toBranchId;
  if (filters.fromLocationId) params.fromLocationId = filters.fromLocationId;
  if (filters.toLocationId) params.toLocationId = filters.toLocationId;
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  const res = await axios.get<PaginatedTransfers>(endpoints.inventoryTransfers.root, { params });
  return res.data;
}

export async function fetchTransfer(id: string): Promise<InventoryTransfer> {
  const res = await axios.get<InventoryTransfer>(endpoints.inventoryTransfers.byId(id));
  return res.data;
}

export async function createTransfer(payload: CreateTransferPayload): Promise<InventoryTransfer> {
  const res = await axios.post<InventoryTransfer>(endpoints.inventoryTransfers.root, payload);
  return res.data;
}

export async function createTransferFromReceipt(
  receiptId: string,
  payload: CreateFromReceiptPayload
): Promise<InventoryTransfer> {
  const res = await axios.post<InventoryTransfer>(
    endpoints.inventoryTransfers.fromReceipt(receiptId),
    payload
  );
  return res.data;
}

export async function dispatchTransfer(id: string): Promise<InventoryTransfer> {
  const res = await axios.post<InventoryTransfer>(endpoints.inventoryTransfers.dispatch(id));
  return res.data;
}

export async function receiveTransfer(
  id: string,
  payload: ReceiveTransferPayload
): Promise<InventoryTransfer> {
  const res = await axios.post<InventoryTransfer>(endpoints.inventoryTransfers.receive(id), payload);
  return res.data;
}

export async function cancelTransfer(
  id: string,
  payload: CancelTransferPayload
): Promise<InventoryTransfer> {
  const res = await axios.post<InventoryTransfer>(endpoints.inventoryTransfers.cancel(id), payload);
  return res.data;
}
