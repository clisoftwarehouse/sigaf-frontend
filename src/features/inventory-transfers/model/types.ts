export type TransferType = 'inter_branch' | 'intra_branch';
export type TransferStatus = 'draft' | 'in_transit' | 'completed' | 'cancelled';

export type InventoryTransferItem = {
  id: string;
  transferId: string;
  productId: string;
  lotId: string;
  quantitySent: number;
  quantityReceived: number | null;
  createdAt: string;
};

export type InventoryTransfer = {
  id: string;
  transferNumber: string;
  transferType: TransferType;
  fromBranchId: string;
  toBranchId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  sourceReceiptId: string | null;
  status: TransferStatus;
  transferDate: string;
  notes: string | null;
  createdBy: string;
  sentBy: string | null;
  sentAt: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InventoryTransferItem[];
};

export type CreateTransferItemPayload = {
  productId: string;
  lotId: string;
  quantitySent: number;
};

export type CreateTransferPayload = {
  transferType: TransferType;
  fromBranchId: string;
  toBranchId: string;
  fromLocationId?: string;
  toLocationId?: string;
  sourceReceiptId?: string;
  transferDate?: string;
  notes?: string;
  items: CreateTransferItemPayload[];
};

export type CreateFromReceiptPayload = {
  transferType: TransferType;
  toLocationId: string;
  fromLocationId?: string;
  toBranchId?: string;
  notes?: string;
};

export type ReceiveTransferItem = {
  itemId: string;
  quantityReceived: number;
};

export type ReceiveTransferPayload = {
  items: ReceiveTransferItem[];
  notes?: string;
};

export type CancelTransferPayload = {
  reason?: string;
};

export type TransferFilters = {
  transferType?: TransferType;
  fromBranchId?: string;
  toBranchId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  status?: TransferStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type PaginatedTransfers = {
  data: InventoryTransfer[];
  total: number;
  page: number;
  limit: number;
};
