export type LibroInventarioGroupBy = 'product' | 'category';

export type LibroInventarioRow = {
  key: string;
  name: string;
  reference: string | null;
  category: string | null;
  quantity: number;
  unitCostUsd: number;
  valueUsd: number;
  valueBs: number;
};

export type LibroInventarioResumen = {
  lines: number;
  totalQuantity: number;
  totalValueUsd: number;
  totalValueBs: number;
};

export type LibroInventarioResult = {
  asOf: string;
  branchId: string | null;
  groupBy: LibroInventarioGroupBy;
  bcvRate: number | null;
  rows: LibroInventarioRow[];
  resumen: LibroInventarioResumen;
};

export type LibroInventarioParams = {
  groupBy?: LibroInventarioGroupBy;
};
