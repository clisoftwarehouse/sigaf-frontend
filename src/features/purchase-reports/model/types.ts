export type VariacionRow = {
  receiptDate: string;
  receiptNumber: string;
  supplierName: string | null;
  productName: string;
  productCode: string | null;
  negotiatedCostUsd: number;
  invoicedCostUsd: number;
  varianceAbsUsd: number;
  variancePct: number;
  cause: string | null;
  approver: string | null;
};
export type VariacionResult = {
  range: { from: string; to: string };
  rows: VariacionRow[];
  resumen: { lines: number; increases: number; decreases: number; totalVarianceUsd: number };
};

export type NivelServicioRow = {
  orderNumber: string;
  orderDate: string;
  supplierName: string | null;
  branchName: string | null;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  fillRatePct: number;
  status: string;
  expectedDate: string | null;
  deliveryDate: string | null;
  daysLate: number | null;
};
export type NivelServicioResult = {
  range: { from: string; to: string };
  rows: NivelServicioRow[];
  resumen: { orders: number; avgFillRatePct: number; lateOrders: number };
};

export type SaldoProveedorRow = {
  supplierName: string;
  rif: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  dueDate: string;
  creditDays: number;
  daysOverdue: number;
  originalUsd: number;
  balanceUsd: number;
  status: 'al_dia' | 'por_vencer' | 'vencida';
};
export type SaldosProveedorResult = {
  asOf: string;
  branchId: string | null;
  rows: SaldoProveedorRow[];
  resumen: { count: number; totalBalanceUsd: number; overdueUsd: number; overdueCount: number };
};
