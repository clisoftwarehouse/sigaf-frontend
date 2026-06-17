export type IgtfPeriod = {
  year: number;
  month: number;
};

export type IgtfRow = {
  date: string;
  documentNumber: string;
  controlNumber: string | null;
  customerRif: string | null;
  customerName: string;
  exchangeRate: number;
  baseUsd: number;
  baseBs: number;
  igtfUsd: number;
  igtfBs: number;
  isReturn: boolean;
};

export type IgtfResumen = {
  totalOperations: number;
  totalBaseUsd: number;
  totalIgtfUsd: number;
  totalBaseBs: number;
  totalIgtfBs: number;
};

export type IgtfReportResult = {
  period: { year: number; month: number; label: string };
  branchId: string | null;
  rate: number;
  rows: IgtfRow[];
  resumen: IgtfResumen;
};
