export const CASH_SESSION_STATUSES = ['open', 'closed', 'audited'] as const;
export type CashSessionStatus = (typeof CASH_SESSION_STATUSES)[number];

export const CASH_MOVEMENT_TYPES = [
  'opening',
  'sale',
  'return',
  'payout',
  'deposit',
  'adjustment',
] as const;
export type CashMovementType = (typeof CASH_MOVEMENT_TYPES)[number];

export const CASH_PAYMENT_METHODS = [
  'EFECTIVO_USD',
  'EFECTIVO_BS',
  'PAGO_MOVIL',
  'TDD',
  'TDC',
  'ZELLE',
  'OTRO',
] as const;
export type CashPaymentMethod = (typeof CASH_PAYMENT_METHODS)[number];

export type CashMovement = {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  paymentMethod: CashPaymentMethod;
  amountUsd: number | string;
  amountBs: number | string;
  exchangeRateUsed: number | string | null;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
};

export type CashSession = {
  id: string;
  terminalId: string;
  branchId: string;
  openedByUserId: string;
  openedAt: string;
  openingAmountUsd: number | string;
  openingAmountBs: number | string;
  closedByUserId: string | null;
  closedAt: string | null;
  closingDeclaredUsd: number | string | null;
  closingDeclaredBs: number | string | null;
  closingCalculatedUsd: number | string | null;
  closingCalculatedBs: number | string | null;
  differenceUsd: number | string | null;
  differenceBs: number | string | null;
  status: CashSessionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  terminal?: { id: string; code: string; name: string | null } | null;
  branch?: { id: string; name: string } | null;
  openedBy?: { id: string; username: string; fullName: string } | null;
  closedBy?: { id: string; username: string; fullName: string } | null;
  movements?: CashMovement[];
};

export type CashSessionsListResponse = {
  data: CashSession[];
  total: number;
  page: number;
  limit: number;
};

export type CashSessionFilters = {
  terminalId?: string;
  branchId?: string;
  status?: CashSessionStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type XReport = {
  byMethod: Record<string, { count: number; totalUsd: number; totalBs: number }>;
  totals: {
    openingUsd: number;
    openingBs: number;
    salesUsd: number;
    returnsUsd: number;
    payoutsUsd: number;
    depositsUsd: number;
    adjustmentsUsd: number;
    expectedUsd: number;
    expectedBs: number;
    movementCount: number;
  };
  generatedAt: string;
};

export type ZReport = {
  session: CashSession;
  totals: XReport;
};

export type OpenCashSessionPayload = {
  terminalId: string;
  openingAmountUsd: number;
  openingAmountBs?: number;
  notes?: string;
};

export type CloseCashSessionPayload = {
  closingDeclaredUsd: number;
  closingDeclaredBs?: number;
  notes?: string;
};
