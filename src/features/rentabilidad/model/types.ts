export type RentabilidadGroupBy = 'product' | 'category';

export type RentabilidadRow = {
  key: string;
  name: string;
  reference: string | null;
  quantitySold: number;
  revenueUsd: number;
  cogsUsd: number;
  marginUsd: number;
  marginPct: number;
};

export type RentabilidadResumen = {
  lines: number;
  totalQuantity: number;
  totalRevenueUsd: number;
  totalCogsUsd: number;
  totalMarginUsd: number;
  marginPct: number;
};

export type RentabilidadResult = {
  range: { from: string; to: string };
  branchId: string | null;
  groupBy: RentabilidadGroupBy;
  rows: RentabilidadRow[];
  resumen: RentabilidadResumen;
};

export type RentabilidadParams = {
  from?: string;
  to?: string;
  groupBy?: RentabilidadGroupBy;
  branchId?: string;
};
