export const PAYMENT_METHODS = [
  'EFECTIVO_USD',
  'EFECTIVO_BS',
  'PAGO_MOVIL',
  'TDD',
  'TDC',
  'ZELLE',
  'OTRO',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  EFECTIVO_USD: 'Efectivo USD',
  EFECTIVO_BS: 'Efectivo Bs',
  PAGO_MOVIL: 'Pago Móvil',
  TDD: 'Débito',
  TDC: 'Crédito',
  ZELLE: 'Zelle',
  OTRO: 'Otro',
};

export type PaymentRow = {
  paymentId: string;
  ticketId: string;
  ticketNumber: number;
  ticketType: 'sale' | 'return';
  ticketStatus: 'finalized' | 'voided';
  paymentMethod: PaymentMethod;
  amountUsd: number;
  amountBs: number;
  exchangeRateUsed: number | null;
  referenceNumber: string | null;
  cardLast4: string | null;
  createdAt: string;
  branchId: string;
  branchName: string | null;
  terminalId: string;
  terminalCode: string | null;
  customerId: string | null;
  customerName: string | null;
};

export type PaymentsSummaryRow = {
  paymentMethod: PaymentMethod;
  count: number;
  totalUsd: number;
  totalBs: number;
};

export type PaymentsReportResponse = {
  data: PaymentRow[];
  summary: PaymentsSummaryRow[];
  total: number;
  page: number;
  limit: number;
};

export type PaymentsReportFilters = {
  from?: string;
  to?: string;
  branchId?: string;
  terminalId?: string;
  paymentMethod?: PaymentMethod;
  page?: number;
  limit?: number;
};
