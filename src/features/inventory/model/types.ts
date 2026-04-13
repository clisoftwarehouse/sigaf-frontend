export type LotStatus = 'available' | 'quarantine' | 'expired' | 'returned' | 'depleted';
export type ExpirySignal = 'EXPIRED' | 'RED' | 'YELLOW' | 'ORANGE' | 'GREEN';
export type AcquisitionType = 'purchase' | 'consignment';
export type AdjustmentType = 'damage' | 'correction' | 'count_difference' | 'expiry_write_off';
export type StockStatus = 'normal' | 'low' | 'out';

// ----------------------------------------------------------------------

export type InventoryLot = {
  id: string;
  productId: string;
  branchId: string;
  lotNumber: string;
  expirationDate: string;
  manufactureDate: string | null;
  acquisitionType: AcquisitionType;
  supplierId: string | null;
  consignmentEntryId: string | null;
  costUsd: number | string;
  salePrice: number | string;
  marginPct: number | string | null;
  quantityReceived: number | string;
  quantityAvailable: number | string;
  quantityReserved: number | string;
  quantitySold: number | string;
  quantityDamaged: number | string;
  quantityReturned: number | string;
  locationId: string | null;
  status: LotStatus;
  createdAt: string;
  updatedAt: string;
  /** Backend-computed signal based on days until expiration. */
  expirySignal: ExpirySignal;
};

export type CreateLotPayload = {
  productId: string;
  branchId: string;
  lotNumber: string;
  expirationDate: string;
  manufactureDate?: string;
  acquisitionType?: AcquisitionType;
  supplierId?: string;
  costUsd: number;
  salePrice: number;
  quantityReceived: number;
  consignmentEntryId?: string;
  locationId?: string;
};

export type UpdateLotPayload = {
  salePrice?: number;
  locationId?: string;
  status?: LotStatus;
};

export type QuarantineLotPayload = {
  quarantine: boolean;
  reason: string;
};

export type LotFilters = {
  productId?: string;
  branchId?: string;
  status?: LotStatus;
  expirySignal?: ExpirySignal;
  page?: number;
  limit?: number;
};

// ----------------------------------------------------------------------

export type StockSummary = {
  productId: string;
  branchId: string;
  totalQuantity: number;
  lotCount: number;
  nearestExpiration: string | null;
};

export type StockFilters = {
  productId?: string;
  branchId?: string;
  categoryId?: string;
  stockStatus?: StockStatus;
  page?: number;
  limit?: number;
};

// ----------------------------------------------------------------------

export type CreateAdjustmentPayload = {
  productId: string;
  lotId: string;
  branchId: string;
  adjustmentType: AdjustmentType;
  /** Positive = in, negative = out. */
  quantity: number;
  /** Min 10 chars per backend validation. */
  reason: string;
};

// ----------------------------------------------------------------------

export type KardexEntry = {
  id: string;
  productId: string;
  branchId: string;
  lotId: string | null;
  movementType: string;
  quantity: number | string;
  unitCostUsd: number | string | null;
  balanceAfter: number | string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  userId: string;
  terminalId: string | null;
  createdAt: string;
};

export type KardexFilters = {
  productId?: string;
  branchId?: string;
  lotId?: string;
  movementType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

// ----------------------------------------------------------------------

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
