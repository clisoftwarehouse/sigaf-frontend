export type DocumentKind = 'invoice' | 'credit_note' | 'debit_note';

export type LibroResumen = {
  totalOperations: number;
  totalExemptBs: number;
  totalTaxableBaseBs: number;
  totalVatBs: number;
  totalBs: number;
  totalExemptUsd: number;
  totalTaxableBaseUsd: number;
  totalVatUsd: number;
  totalUsd: number;
};

export type LibroVentasRow = {
  date: string;
  documentKind: DocumentKind;
  documentNumber: string;
  controlNumber: string | null;
  customerRif: string | null;
  customerName: string;
  exchangeRate: number;
  exemptBs: number;
  taxableBaseBs: number;
  vatBs: number;
  totalBs: number;
  exemptUsd: number;
  taxableBaseUsd: number;
  vatUsd: number;
  totalUsd: number;
  isContribuyente: boolean;
};

export type LibroComprasRow = {
  date: string;
  documentKind: DocumentKind;
  documentNumber: string | null;
  controlNumber: string | null;
  supplierRif: string;
  supplierName: string;
  exchangeRate: number | null;
  exemptBs: number;
  taxableBaseBs: number;
  vatBs: number;
  totalBs: number;
  exemptUsd: number;
  taxableBaseUsd: number;
  vatUsd: number;
  totalUsd: number;
  generatesCredit: boolean;
  complianceWarnings: string[];
};

export type LibroVentasResult = {
  period: { year: number; month: number; label: string };
  branchId: string | null;
  rows: LibroVentasRow[];
  resumen: LibroResumen;
  breakdown: {
    contribuyentesUsd: number;
    noContribuyentesUsd: number;
  };
};

export type LibroComprasResult = {
  period: { year: number; month: number; label: string };
  branchId: string | null;
  rows: LibroComprasRow[];
  resumen: LibroResumen;
  nonDeductibleVatUsd: number;
};

export type LibroPeriod = {
  year: number;
  month: number;
};
