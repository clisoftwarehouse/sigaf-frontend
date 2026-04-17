import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const PromotionsListPage = lazy(() => import('./ui/pages/promotions-list-page'));

export const promotionsRoutes: RouteObject[] = [
  { path: 'promotions', element: <PromotionsListPage /> },
];
