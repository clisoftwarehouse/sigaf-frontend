import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const CashSessionsListPage = lazy(() => import('./ui/pages/cash-sessions-list-page'));
const CashSessionDetailPage = lazy(() => import('./ui/pages/cash-session-detail-page'));

export const cashSessionsRoutes: RouteObject[] = [
  { path: 'cash-sessions', element: <CashSessionsListPage /> },
  { path: 'cash-sessions/:id', element: <CashSessionDetailPage /> },
];
