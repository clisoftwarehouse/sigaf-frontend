export type CurrencyNative = 'USD' | 'VES';
export type CxpStatus = 'open' | 'partial' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'dollars' | 'mixed' | 'other';
export type AgingBucket =
  | 'current'
  | 'overdue_1_30'
  | 'overdue_31_60'
  | 'overdue_61_90'
  | 'overdue_90_plus';

export type AccountsPayable = {
  id: string;
  supplierId: string;
  supplier: { id: string; name: string } | null;
  branchId: string;
  branch: { id: string; name: string } | null;
  sourceReceiptId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string;
  dueDate: string;
  currencyNative: CurrencyNative;
  originalAmountUsd: number;
  originalAmountNative: number;
  exchangeRateAtCreation: number | null;
  paidAmountUsd: number;
  /** IVA retenido al proveedor (contribuyente especial). Descontado del balance. */
  ivaRetentionUsd?: number;
  balanceUsd: number;
  status: CxpStatus;
  paymentTermsDays: number;
  agingBucket: AgingBucket;
  daysOverdue: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: AccountsPayablePayment[];
};

export type AccountsPayablePayment = {
  id: string;
  accountsPayableId: string;
  paymentDate: string;
  amountUsd: number;
  amountNative: number;
  currencyNative: CurrencyNative;
  exchangeRate: number | null;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paidByUserId: string;
  reversedAt: string | null;
  reversedByUserId: string | null;
  reversedReason: string | null;
  createdAt: string;
};

export type AgingSummary = {
  branchId?: string;
  buckets: Record<AgingBucket, { count: number; totalUsd: number }>;
  totalOpenUsd: number;
  totalOpenCount: number;
  totalOverdueUsd: number;
  totalOverdueCount: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CxpFilters = {
  branchId?: string;
  supplierId?: string;
  status?: CxpStatus;
  agingBucket?: AgingBucket;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type RegisterPaymentInput = {
  paymentDate?: string;
  amountUsd: number;
  amountNative: number;
  currencyNative: CurrencyNative;
  exchangeRate?: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
};
