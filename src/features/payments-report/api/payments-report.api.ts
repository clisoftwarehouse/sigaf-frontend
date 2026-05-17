import type { PaymentsReportFilters, PaymentsReportResponse } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchPaymentsReport(
  filters: PaymentsReportFilters = {}
): Promise<PaymentsReportResponse> {
  const params: Record<string, string | number> = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.terminalId) params.terminalId = filters.terminalId;
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  const res = await axios.get<PaymentsReportResponse>(endpoints.sales.payments, { params });
  return res.data;
}
