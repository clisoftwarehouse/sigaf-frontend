/** Un cierre Z capturado de una máquina fiscal (GET /v1/fiscal-z-reports). */
export type ReporteZRow = {
  id: string;
  machineSerial: string;
  zNumber: string;
  branchId: string | null;
  terminalId: string | null;
  printerDatetime: string | null;
  zReportDate: string | null;
  // Los numeric de Postgres llegan como string vía TypeORM.
  exemptSales: number | string;
  generalRate1Sale: number | string;
  generalRate1Tax: number | string;
  reducedRate2Sale: number | string;
  reducedRate2Tax: number | string;
  additionalRate3Sale: number | string;
  additionalRate3Tax: number | string;
  totalDevolution: number | string;
  totalTax: number | string;
  totalSalesGross: number | string;
  totalSalesNet: number | string;
  lastInvoiceNumber: string | null;
  lastCreditNoteNumber: string | null;
  closedAt: string | null;
  createdAt: string;
};
