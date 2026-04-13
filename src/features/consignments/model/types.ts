export type ConsignmentStatus = 'active' | 'liquidated' | 'returned' | 'closed';
export type LiquidationStatus = 'draft' | 'approved' | 'paid';

// ----------------------------------------------------------------------

export type ConsignmentEntryItem = {
  id: string;
  consignmentEntryId: string;
  productId: string;
  lotNumber: string;
  expirationDate: string;
  quantity: number | string;
  quantityRemaining: number | string;
  costUsd: number | string;
  salePrice: number | string;
};

export type ConsignmentEntry = {
  id: string;
  branchId: string;
  supplierId: string;
  commissionPct: number | string;
  status: ConsignmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ConsignmentEntryItem[];
};

export type CreateConsignmentEntryItemPayload = {
  productId: string;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  costUsd: number;
  salePrice: number;
};

export type CreateConsignmentEntryPayload = {
  branchId: string;
  supplierId: string;
  commissionPct: number;
  notes?: string;
  items: CreateConsignmentEntryItemPayload[];
};

// ----------------------------------------------------------------------

export type ConsignmentReturnItem = {
  id: string;
  consignmentReturnId: string;
  consignmentItemId: string;
  lotId: string;
  quantity: number | string;
  costUsd: number | string;
};

export type ConsignmentReturn = {
  id: string;
  consignmentEntryId: string;
  branchId: string;
  supplierId: string;
  reason: string;
  notes: string | null;
  createdAt: string;
  items?: ConsignmentReturnItem[];
};

export type CreateConsignmentReturnItemPayload = {
  consignmentItemId: string;
  lotId: string;
  quantity: number;
  costUsd: number;
};

export type CreateConsignmentReturnPayload = {
  consignmentEntryId: string;
  branchId: string;
  supplierId: string;
  reason: string;
  notes?: string;
  items: CreateConsignmentReturnItemPayload[];
};

// ----------------------------------------------------------------------

export type ConsignmentLiquidationItem = {
  id: string;
  consignmentLiquidationId: string;
  consignmentItemId: string;
  quantitySold: number | string;
  totalSales: number | string;
  commissionAmount: number | string;
  supplierAmount: number | string;
};

export type ConsignmentLiquidation = {
  id: string;
  branchId: string;
  supplierId: string;
  consignmentEntryId: string | null;
  periodStart: string;
  periodEnd: string;
  totalSales: number | string;
  totalCommission: number | string;
  totalSupplier: number | string;
  status: LiquidationStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  items?: ConsignmentLiquidationItem[];
};

export type CreateConsignmentLiquidationPayload = {
  branchId: string;
  supplierId: string;
  periodStart: string;
  periodEnd: string;
  consignmentEntryId?: string;
};

// ----------------------------------------------------------------------

export type ConsignmentFilters = {
  branchId?: string;
  supplierId?: string;
  status?: ConsignmentStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
