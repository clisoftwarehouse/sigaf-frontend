export type LibroInventarioRow = {
  code: string | null;
  name: string;
  // Unidades
  initialQty: number;
  comprasInQty: number;
  comprasOutQty: number;
  ventasInQty: number;
  ventasOutQty: number;
  ajustesInQty: number;
  ajustesOutQty: number;
  autoConsumoQty: number;
  finalQty: number;
  // Bolívares (al costo)
  initialBs: number;
  comprasInBs: number;
  comprasOutBs: number;
  ventasInBs: number;
  ventasOutBs: number;
  ajustesInBs: number;
  ajustesOutBs: number;
  autoConsumoBs: number;
  finalBs: number;
};

export type LibroInventarioResumen = Omit<LibroInventarioRow, 'code' | 'name'> & {
  lines: number;
};

export type LibroInventarioResult = {
  period: { year: number; month: number; label: string };
  branchId: string | null;
  bcvRate: number | null;
  rows: LibroInventarioRow[];
  resumen: LibroInventarioResumen;
};

export type LibroInventarioParams = {
  year?: number;
  month?: number;
  branchId?: string;
};
