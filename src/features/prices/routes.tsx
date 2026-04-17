import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const PricesListPage = lazy(() => import('./ui/pages/prices-list-page'));

export const pricesRoutes: RouteObject[] = [{ path: 'prices', element: <PricesListPage /> }];
