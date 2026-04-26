export type OrderStatus = 'draft' | 'sent' | 'partial' | 'complete' | 'cancelled';
export type OrderType = 'purchase' | 'consignment';
export type ReceiptType = 'purchase' | 'consignment';

// ----------------------------------------------------------------------

export type PurchaseOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number | string;
  unitCostUsd: number | string;
  discountPct: number | string | null;
  subtotalUsd: number | string;
  quantityReceived: number | string;
};

export type PurchaseOrder = {
  id: string;
  branchId: string;
  supplierId: string;
  orderNumber: string;
  orderDate: string;
  orderType: OrderType;
  status: OrderStatus;
  expectedDate: string | null;
  notes: string | null;
  subtotalUsd: number | string;
  taxUsd: number | string;
  totalUsd: number | string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
};

export type CreatePurchaseOrderItemPayload = {
  productId: string;
  quantity: number;
  unitCostUsd: number;
  discountPct?: number;
};

export type CreatePurchaseOrderPayload = {
  branchId: string;
  supplierId: string;
  orderType?: OrderType;
  expectedDate?: string;
  notes?: string;
  items: CreatePurchaseOrderItemPayload[];
};

export type UpdatePurchaseOrderPayload = {
  status?: 'draft' | 'sent' | 'cancelled';
  expectedDate?: string;
  notes?: string;
};

export type PurchaseOrderFilters = {
  branchId?: string;
  supplierId?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

// ----------------------------------------------------------------------

export type GoodsReceiptItem = {
  id: string;
  goodsReceiptId: string;
  purchaseOrderId: string | null;
  productId: string;
  lotId: string;
  quantity: number | string;
  unitCostUsd: number | string;
  discountPct: number | string;
  subtotalUsd: number | string;
  salePrice: number | string;
  lotNumber: string;
  expirationDate: string;
};

export type GoodsReceipt = {
  id: string;
  branchId: string;
  supplierId: string;
  purchaseOrderIds?: string[];
  receiptNumber: string;
  receiptDate: string;
  receiptType: ReceiptType;
  supplierInvoiceNumber: string | null;
  notes: string | null;
  subtotalUsd: number | string;
  totalDiscountUsd: number | string;
  taxPct: number | string;
  taxUsd: number | string;
  igtfPct: number | string;
  igtfUsd: number | string;
  totalUsd: number | string;
  createdAt: string;
  items?: GoodsReceiptItem[];
};

export type CreateGoodsReceiptItemPayload = {
  purchaseOrderId?: string;
  productId: string;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  unitCostUsd: number;
  salePrice: number;
  discountPct?: number;
  locationId?: string;
};

export type CreateGoodsReceiptPayload = {
  branchId: string;
  supplierId: string;
  supplierInvoiceNumber?: string;
  receiptType?: ReceiptType;
  taxPct?: number;
  igtfPct?: number;
  notes?: string;
  items: CreateGoodsReceiptItemPayload[];
};

export type GoodsReceiptFilters = {
  branchId?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  from?: string;
  to?: string;
};

// ----------------------------------------------------------------------

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
