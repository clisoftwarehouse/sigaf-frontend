export type RiesgoRow = {
  productName: string;
  productCode: string | null;
  supplierName: string | null;
  lotNumber: string;
  expirationDate: string;
  daysToExpiry: number;
  quantity: number;
  costCommittedUsd: number;
  status: 'vencido' | 'critico' | 'proximo';
};
export type RiesgoResult = {
  asOf: string;
  horizonDays: number;
  branchId: string | null;
  rows: RiesgoRow[];
  resumen: { lines: number; expiredCount: number; expiredCostUsd: number; atRiskCount: number; atRiskCostUsd: number };
};

export type MermaRow = {
  date: string;
  productName: string;
  productCode: string | null;
  lotNumber: string | null;
  quantity: number;
  costLostUsd: number;
  cause: string;
  reason: string | null;
};
export type MermaResult = {
  range: { from: string; to: string };
  branchId: string | null;
  rows: MermaRow[];
  resumen: {
    lines: number;
    totalQuantity: number;
    totalCostUsd: number;
    byCause: { cause: string; quantity: number; costUsd: number }[];
  };
};

export type DiasInventarioRow = {
  productName: string;
  productCode: string | null;
  category: string | null;
  currentStock: number;
  dailyAvg: number;
  daysProjected: number | null;
  status: 'quiebre' | 'optimo' | 'sobrestock';
};
export type DiasInventarioResult = {
  branchId: string | null;
  windowDays: number;
  rows: DiasInventarioRow[];
  resumen: { lines: number; quiebre: number; sobrestock: number };
};

export type CapitalEstancadoRow = {
  productName: string;
  productCode: string | null;
  supplierName: string | null;
  lotNumber: string;
  lastMovementDate: string | null;
  daysSinceMovement: number;
  units: number;
  valueStuckUsd: number;
};
export type CapitalEstancadoResult = {
  asOf: string;
  minDays: number;
  branchId: string | null;
  rows: CapitalEstancadoRow[];
  resumen: { lines: number; totalValueUsd: number };
};

export type ParetoRow = {
  productName: string;
  productCode: string | null;
  category: string | null;
  salesUsd: number;
  participationPct: number;
  cumulativePct: number;
  abcClass: 'A' | 'B' | 'C';
  unitsSold: number;
};
export type ParetoResult = {
  range: { from: string; to: string };
  branchId: string | null;
  rows: ParetoRow[];
  resumen: { lines: number; totalSalesUsd: number; aCount: number; bCount: number; cCount: number };
};

export type TransferenciaRow = {
  transferNumber: string;
  transferDate: string;
  transferType: string;
  fromBranch: string | null;
  toBranch: string | null;
  status: string;
  itemCount: number;
  totalQuantity: number;
};
export type TransferenciasResult = {
  range: { from: string; to: string };
  rows: TransferenciaRow[];
  resumen: { lines: number; byStatus: { status: string; count: number }[] };
};
