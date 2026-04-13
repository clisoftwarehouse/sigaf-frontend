import type { ExchangeRateFilters, CreateExchangeRatePayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createExchangeRate,
  fetchExchangeRates,
  fetchLatestExchangeRate,
} from './exchange-rates.api';

// ----------------------------------------------------------------------

export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  list: (filters: ExchangeRateFilters) => [...exchangeRateKeys.all, 'list', filters] as const,
  latest: (from?: string, to?: string) =>
    [...exchangeRateKeys.all, 'latest', from ?? '', to ?? ''] as const,
};

export function useExchangeRatesQuery(filters: ExchangeRateFilters = {}) {
  return useQuery({
    queryKey: exchangeRateKeys.list(filters),
    queryFn: () => fetchExchangeRates(filters),
  });
}

export function useLatestExchangeRateQuery(currencyFrom?: string, currencyTo?: string) {
  return useQuery({
    queryKey: exchangeRateKeys.latest(currencyFrom, currencyTo),
    queryFn: () => fetchLatestExchangeRate(currencyFrom, currencyTo),
    staleTime: 60_000,
  });
}

export function useCreateExchangeRateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExchangeRatePayload) => createExchangeRate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeRateKeys.all }),
  });
}
