// ----------------------------------------------------------------------
// Detalle de una venta (ticket). Alineado con SaleTicketEntity + relaciones
// que devuelve GET /v1/sales/tickets/:id. Los numéricos de TypeORM llegan como
// string en JSON, por eso `number | string`.
// ----------------------------------------------------------------------

export type SaleTicketItem = {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productName: string;
  unitPriceUsd: number | string;
  vatRate: number | string;
  discountPercent: number | string;
  quantity: number | string;
  lineSubtotalExemptUsd: number | string;
  lineSubtotalTaxableUsd: number | string;
  lineVatUsd: number | string;
  lineTotalUsd: number | string;
  requiresRx: boolean;
  promotionId: string | null;
  product?: { id: string; description: string; shortName: string | null } | null;
};

export type SaleTicketPayment = {
  id: string;
  paymentMethod: string;
  amountUsd: number | string;
  amountBs: number | string;
  exchangeRateUsed: number | string;
  isFx: boolean;
  referenceNumber: string | null;
  cardLast4: string | null;
};

export type SaleTicketDetail = {
  id: string;
  ticketNumber: number;
  provisionalNumber: string | null;
  controlNumber: string | null;
  status: string;
  type: string;
  customerId: string | null;
  customer?: {
    id: string;
    fullName: string;
    documentType: string | null;
    documentNumber: string | null;
  } | null;
  salespersonUserId: string;
  salesperson?: { id: string; fullName: string; email: string | null } | null;
  branchId: string;
  branch?: { id: string; name: string } | null;
  terminalId: string;
  terminal?: { id: string; code: string; name: string | null } | null;
  referenceTicketId: string | null;
  subtotalExemptUsd: number | string;
  subtotalTaxableUsd: number | string;
  vatAmountUsd: number | string;
  igtfAmountUsd: number | string;
  totalUsd: number | string;
  totalPaidUsd: number | string;
  changeUsd: number | string;
  exchangeRateUsdBs: number | string;
  totalBs: number | string;
  createdAt: string;
  items: SaleTicketItem[];
  payments: SaleTicketPayment[];
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  EFECTIVO_USD: 'Efectivo USD',
  EFECTIVO_BS: 'Efectivo Bs',
  PAGO_MOVIL: 'Pago móvil',
  TDD: 'Débito',
  TDC: 'Crédito',
  ZELLE: 'Zelle',
  OTRO: 'Otro',
};

export const SALE_STATUS_LABEL: Record<string, string> = {
  finalized: 'Finalizada',
  voided: 'Anulada',
};
