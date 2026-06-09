import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const IntelligencePage = lazy(() => import('./ui/pages/intelligence-page'));

export const purchasesIntelligenceRoutes: RouteObject[] = [
  { path: 'intelligence', element: <IntelligencePage /> },
];
