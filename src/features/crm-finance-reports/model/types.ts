export type PacienteCronicoRow = {
  customerName: string;
  document: string;
  productName: string;
  purchases: number;
  lastPurchase: string;
  avgIntervalDays: number;
  nextExpected: string;
  status: 'activo' | 'por_recomprar' | 'desertor';
};
export type PacientesCronicosResult = {
  asOf: string;
  lookbackDays: number;
  rows: PacienteCronicoRow[];
  resumen: { lines: number; desertores: number; porRecomprar: number };
};

export type ComportamientoRow = {
  customerName: string;
  document: string;
  customerType: string;
  firstPurchase: string;
  lastPurchase: string;
  tickets: number;
  totalUsd: number;
  topCategory: string | null;
  segment: 'VIP' | 'recurrente' | 'esporadico';
};
export type ComportamientoResult = {
  asOf: string;
  rows: ComportamientoRow[];
  resumen: { customers: number; vip: number; recurrentes: number; totalUsd: number };
};

export type FlujoCajaRow = {
  weekStart: string;
  weekEnd: string;
  projectedIncomeUsd: number;
  payablesDueUsd: number;
  netUsd: number;
  cumulativeUsd: number;
};
export type FlujoCajaResult = {
  asOf: string;
  weeks: number;
  avgDailySalesUsd: number;
  rows: FlujoCajaRow[];
  resumen: { totalIncomeUsd: number; totalPayablesUsd: number; netUsd: number };
};
