export type DocumentKind = 'invoice' | 'credit_note' | 'debit_note';

export type LibroResumen = {
  totalOperations: number;
  totalExemptUsd: number;
  totalTaxableBaseUsd: number;
  totalVatUsd: number;
  totalUsd: number;
  totalBs: number;
};

export type LibroVentasRow = {
  date: string;
  documentKind: DocumentKind;
  documentNumber: string;
  controlNumber: string | null;
  customerRif: string | null;
  customerName: string;
  totalUsd: number;
  totalBs: number;
  exemptUsd: number;
  taxableBaseUsd: number;
  vatUsd: number;
  exchangeRate: number;
  byFiscalMachine: boolean;
  isContribuyente: boolean;
};

export type LibroComprasRow = {
  date: string;
  documentKind: DocumentKind;
  documentNumber: string | null;
  controlNumber: string | null;
  supplierRif: string;
  supplierName: string;
  totalUsd: number;
  totalBs: number;
  exemptUsd: number;
  taxableBaseUsd: number;
  vatUsd: number;
  exchangeRate: number | null;
  generatesCredit: boolean;
  complianceWarnings: string[];
};

export type LibroVentasResult = {
  period: { year: number; month: number; label: string };
  branchId: string | null;
  rows: LibroVentasRow[];
  resumen: LibroResumen;
  breakdown: {
    byFiscalMachineUsd: number;
    byElectronicMeansUsd: number;
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
