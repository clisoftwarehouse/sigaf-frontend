import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const SaleDetailPage = lazy(() => import('./ui/pages/sale-detail-page'));

export const salesRoutes: RouteObject[] = [{ path: 'ventas/:id', element: <SaleDetailPage /> }];
