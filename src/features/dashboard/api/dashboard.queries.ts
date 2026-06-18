import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export type DashboardSummary = {
  asOf: string;
  sales: {
    todayUsd: number;
    todayTickets: number;
    monthUsd: number;
    monthTickets: number;
    prevMonthUsd: number;
    momChangePct: number | null;
    avgTicketUsd: number;
    trend: { date: string; totalUsd: number }[];
  };
  profit: {
    monthRevenueUsd: number;
    monthCogsUsd: number;
    monthMarginUsd: number;
    monthMarginPct: number;
    topProducts: { name: string; salesUsd: number; units: number }[];
  };
  finance: {
    payablesOpenUsd: number;
    payablesOverdueUsd: number;
    cashDiffTodayUsd: number;
    avgDailySalesUsd: number;
    cashflow: { weekStart: string; incomeUsd: number; payablesUsd: number; netUsd: number }[];
  };
  inventory: {
    inventoryValueUsd: number;
    stalledCapitalUsd: number;
  };
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<DashboardSummary>(endpoints.dashboard.summary);
      return data;
    },
    staleTime: 60_000,
  });
}
