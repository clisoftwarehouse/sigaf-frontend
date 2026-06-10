import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const PrescribersPage = lazy(() => import('./ui/pages/prescribers-page'));

export const prescribersRoutes: RouteObject[] = [
  { path: 'prescribers', element: <PrescribersPage /> },
];
