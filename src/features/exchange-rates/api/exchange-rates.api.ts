import type {
  ExchangeRate,
  ExchangeRateFilters,
  OverrideRatePayload,
  CreateExchangeRatePayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchExchangeRates(
  filters: ExchangeRateFilters = {}
): Promise<ExchangeRate[]> {
  const params: Record<string, string> = {};
  if (filters.currencyFrom) params.currencyFrom = filters.currencyFrom;
  if (filters.currencyTo) params.currencyTo = filters.currencyTo;
  if (filters.limit !== undefined) params.limit = String(filters.limit);
  const res = await axios.get<ExchangeRate[]>(endpoints.exchangeRates.root, { params });
  return res.data;
}

export async function fetchLatestExchangeRate(
  currencyFrom?: string,
  currencyTo?: string
): Promise<ExchangeRate | null> {
  const params: Record<string, string> = {};
  if (currencyFrom) params.currencyFrom = currencyFrom;
  if (currencyTo) params.currencyTo = currencyTo;
  const res = await axios.get<ExchangeRate | null>(endpoints.exchangeRates.latest, { params });
  return res.data;
}

export async function createExchangeRate(
  payload: CreateExchangeRatePayload
): Promise<ExchangeRate> {
  const res = await axios.post<ExchangeRate>(endpoints.exchangeRates.root, payload);
  return res.data;
}

export async function fetchBcvRate(): Promise<ExchangeRate> {
  const res = await axios.post<ExchangeRate>(endpoints.exchangeRates.fetchBcv);
  return res.data;
}

export async function overrideExchangeRate(payload: OverrideRatePayload): Promise<ExchangeRate> {
  const res = await axios.post<ExchangeRate>(endpoints.exchangeRates.override, payload);
  return res.data;
}
