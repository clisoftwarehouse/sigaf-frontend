export type ReporteXRow = {
  sessionId: string;
  terminalName: string | null;
  branchName: string | null;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  firstTicket: string | null;
  lastTicket: string | null;
  totalSalesUsd: number;
  byMethod: { method: string; amountUsd: number }[];
  differenceUsd: number;
};
export type ReporteXResult = {
  range: { from: string; to: string };
  rows: ReporteXRow[];
  resumen: { sessions: number; totalSalesUsd: number };
};

export type DevolucionRow = {
  date: string;
  branchName: string | null;
  cashierName: string;
  creditNoteNumber: string;
  originalNumber: string | null;
  itemCount: number;
  totalUsd: number;
  refundMethods: string;
};
export type DevolucionesResult = {
  range: { from: string; to: string };
  rows: DevolucionRow[];
  resumen: { lines: number; totalUsd: number };
};

export type TransaccionRow = {
  date: string;
  ticketNumber: string;
  cashierName: string;
  category: string | null;
  ean: string | null;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  discountPct: number;
  finalLineUsd: number;
  costUsd: number;
  marginUsd: number;
};
export type TransaccionesResult = {
  range: { from: string; to: string };
  rows: TransaccionRow[];
  resumen: { lines: number; totalUsd: number; totalCostUsd: number; totalMarginUsd: number };
};

export type TicketPromedioRow = {
  date: string;
  band: string;
  tickets: number;
  units: number;
  upt: number;
  vptUsd: number;
};
export type TicketPromedioResult = {
  range: { from: string; to: string };
  rows: TicketPromedioRow[];
  resumen: { tickets: number; units: number; upt: number; vptUsd: number; totalUsd: number };
};

export type ProductividadRow = {
  cashierName: string;
  tickets: number;
  units: number;
  totalUsd: number;
  avgTicketUsd: number;
  sessions: number;
  cashDiffUsd: number;
};
export type ProductividadResult = {
  range: { from: string; to: string };
  rows: ProductividadRow[];
  resumen: { cashiers: number; tickets: number; totalUsd: number };
};

export type EfectividadPromoRow = {
  promotionName: string;
  promotionType: string;
  lines: number;
  units: number;
  soldUsd: number;
  discountUsd: number;
};
export type EfectividadPromosResult = {
  range: { from: string; to: string };
  rows: EfectividadPromoRow[];
  resumen: { promos: number; totalSoldUsd: number; totalDiscountUsd: number };
};
