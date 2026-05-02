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
  /**
   * Días restantes antes de auto-cancelación (solo para draft, según política
   * SIGAF de OCs §6: 30 días). `null` para OCs en cualquier otro estado.
   */
  daysUntilAutoCancel?: number | null;
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

export type DiscrepancyReason =
  | 'expired'
  | 'defective'
  | 'damaged_packaging'
  | 'damaged_in_transit'
  | 'incorrect_product'
  | 'missing'
  | 'excess'
  | 'quality_failure'
  | 'other';

export const DISCREPANCY_REASONS: DiscrepancyReason[] = [
  'expired',
  'defective',
  'damaged_packaging',
  'damaged_in_transit',
  'incorrect_product',
  'missing',
  'excess',
  'quality_failure',
  'other',
];

export const DISCREPANCY_REASON_LABEL: Record<DiscrepancyReason, string> = {
  expired: 'Vencido / próximo a vencer',
  defective: 'Defectuoso de fábrica',
  damaged_packaging: 'Empaque dañado',
  damaged_in_transit: 'Daño durante transporte',
  incorrect_product: 'Producto incorrecto',
  missing: 'Faltante',
  excess: 'Sobrante',
  quality_failure: 'Falla de control de calidad',
  other: 'Otro',
};

export type ReceiptItemDiscrepancy = {
  id: string;
  receiptItemId: string;
  reason: DiscrepancyReason;
  quantity: number | string;
  notes: string | null;
};

export type GoodsReceiptItem = {
  id: string;
  goodsReceiptId: string;
  purchaseOrderId: string | null;
  productId: string;
  /** Null mientras la recepción esté en `requiresReapproval`. */
  lotId: string | null;
  quantity: number | string;
  /** Cantidad facturada por el proveedor. Default = `quantity` en recepciones legacy. */
  invoicedQuantity: number | string | null;
  unitCostUsd: number | string;
  discountPct: number | string;
  subtotalUsd: number | string;
  salePrice: number | string;
  lotNumber: string;
  expirationDate: string;
  discrepancies?: ReceiptItemDiscrepancy[];
};

export type ReceiptNativeCurrency = 'USD' | 'VES';

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
  /** True si la recepción excedió tolerancia y está bloqueada hasta reaprobación. */
  requiresReapproval: boolean;
  reapprovedBy: string | null;
  reapprovedAt: string | null;
  reapprovalJustification: string | null;
  /** Moneda original de la factura (Fase D). Default 'USD' en recepciones legacy. */
  nativeCurrency: ReceiptNativeCurrency;
  /** Total que dice la factura en su moneda original. Null si nativeCurrency='USD'. */
  nativeTotal: number | string | null;
  /** Tasa Bs./USD congelada al momento de registrar. Null si nativeCurrency='USD'. */
  exchangeRateUsed: number | string | null;
  /** FK opcional al snapshot en exchange_rates (BCV o manual). */
  exchangeRateId: string | null;
  createdAt: string;
  items?: GoodsReceiptItem[];
};

export type DiscrepancyInputPayload = {
  reason: DiscrepancyReason;
  quantity: number;
  notes?: string;
};

export type CreateGoodsReceiptItemPayload = {
  purchaseOrderId?: string;
  productId: string;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  /** Cantidad facturada por el proveedor. Default = `quantity` si se omite. */
  invoicedQuantity?: number;
  unitCostUsd: number;
  /** Opcional (Fase E): si se omite, el lote entra sin precio publicado y la fijación queda al módulo de Precios. */
  salePrice?: number;
  discountPct?: number;
  locationId?: string;
  discrepancies?: DiscrepancyInputPayload[];
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
  /**
   * Moneda original de la factura. Default 'USD'. Si se envía 'VES', `nativeTotal`
   * es obligatorio. `exchangeRateUsed` es opcional (si se omite, el backend
   * resuelve la última tasa BCV registrada).
   */
  nativeCurrency?: ReceiptNativeCurrency;
  nativeTotal?: number;
  exchangeRateUsed?: number;
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
