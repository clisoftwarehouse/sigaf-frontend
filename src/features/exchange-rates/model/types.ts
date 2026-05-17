export const RATE_SOURCES = ['BCV', 'REPOSICION', 'manual'] as const;
export type RateSource = (typeof RATE_SOURCES)[number];

export const RATE_SOURCE_LABEL: Record<RateSource, string> = {
  BCV: 'BCV',
  REPOSICION: 'Reposición',
  manual: 'Manual',
};

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
  source?: RateSource;
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
  source?: RateSource;
  limit?: number;
};
