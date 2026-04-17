export type ExchangeRate = {
  id: string;
  currencyFrom: string;
  currencyTo: string;
  rate: number | string;
  source: string;
  effectiveDate: string;
  isOverridden: boolean;
  createdAt: string;
};

export type CreateExchangeRatePayload = {
  currencyFrom?: string;
  currencyTo?: string;
  rate: number;
  source?: string;
  /** ISO date string, e.g. `2026-04-11`. */
  effectiveDate: string;
};

export type OverrideRatePayload = {
  rate: number;
  effectiveDate?: string;
  currencyFrom?: string;
  currencyTo?: string;
  notes?: string;
};

export type ExchangeRateFilters = {
  currencyFrom?: string;
  currencyTo?: string;
  limit?: number;
};
