import type {
  ExchangeRateFilters,
  OverrideRatePayload,
  CreateExchangeRatePayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchBcvRate,
  createExchangeRate,
  fetchExchangeRates,
  overrideExchangeRate,
  fetchLatestExchangeRate,
} from './exchange-rates.api';

// ----------------------------------------------------------------------

export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  list: (filters: ExchangeRateFilters) => [...exchangeRateKeys.all, 'list', filters] as const,
  latest: (from?: string, to?: string, source?: string) =>
    [...exchangeRateKeys.all, 'latest', from ?? '', to ?? '', source ?? ''] as const,
};

export function useExchangeRatesQuery(filters: ExchangeRateFilters = {}) {
  return useQuery({
    queryKey: exchangeRateKeys.list(filters),
    queryFn: () => fetchExchangeRates(filters),
  });
}

export function useLatestExchangeRateQuery(
  currencyFrom?: string,
  currencyTo?: string,
  source?: string
) {
  return useQuery({
    queryKey: exchangeRateKeys.latest(currencyFrom, currencyTo, source),
    queryFn: () => fetchLatestExchangeRate(currencyFrom, currencyTo, source),
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

export function useFetchBcvRateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchBcvRate(),
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeRateKeys.all }),
  });
}

export function useOverrideExchangeRateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OverrideRatePayload) => overrideExchangeRate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: exchangeRateKeys.all }),
  });
}
