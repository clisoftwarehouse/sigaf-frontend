import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ExchangeRatesPage = lazy(() => import('./ui/pages/exchange-rates-page'));

export const exchangeRatesRoutes: RouteObject[] = [
  { path: 'exchange-rates', element: <ExchangeRatesPage /> },
];
