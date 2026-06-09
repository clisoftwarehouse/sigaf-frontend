import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ComparatorPage = lazy(() => import('./ui/pages/comparator-page'));

export const purchasesComparatorRoutes: RouteObject[] = [
  { path: 'comparator', element: <ComparatorPage /> },
];
