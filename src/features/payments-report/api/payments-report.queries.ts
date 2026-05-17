import type { PaymentsReportFilters } from '../model/types';

import { useQuery } from '@tanstack/react-query';

import { fetchPaymentsReport } from './payments-report.api';

// ----------------------------------------------------------------------

export const paymentsReportKeys = {
  all: ['payments-report'] as const,
  list: (filters: PaymentsReportFilters) =>
    [...paymentsReportKeys.all, 'list', filters] as const,
};

export function usePaymentsReportQuery(filters: PaymentsReportFilters = {}) {
  return useQuery({
    queryKey: paymentsReportKeys.list(filters),
    queryFn: () => fetchPaymentsReport(filters),
    placeholderData: (prev) => prev,
  });
}
