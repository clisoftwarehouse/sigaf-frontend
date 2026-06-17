export type ControladoDispensation = {
  date: string;
  productName: string;
  productCode: string | null;
  quantity: number;
  patientName: string;
  patientDocument: string | null;
  doctorName: string | null;
  doctorMpps: string | null;
  doctorCedula: string | null;
  prescriptionNumber: string | null;
  prescriptionDate: string | null;
};

export type ControladoSummaryRow = {
  productId: string;
  productName: string;
  productCode: string | null;
  entradas: number;
  salidas: number;
  saldoActual: number;
};

export type ControladosResult = {
  period: { year: number; month: number; label: string };
  branchId: string | null;
  dispensations: ControladoDispensation[];
  summary: ControladoSummaryRow[];
  totals: {
    dispensations: number;
    totalDispensed: number;
  };
};

export type ControladosPeriod = {
  year: number;
  month: number;
};
