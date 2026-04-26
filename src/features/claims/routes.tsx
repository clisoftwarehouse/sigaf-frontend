import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ClaimsListPage = lazy(() => import('./ui/pages/claims-list-page'));
const ClaimCreatePage = lazy(() => import('./ui/pages/claim-create-page'));
const ClaimDetailPage = lazy(() => import('./ui/pages/claim-detail-page'));
const ClaimPrintPage = lazy(() => import('./ui/pages/claim-print-page'));

export const claimsRoutes: RouteObject[] = [
  { path: 'claims', element: <ClaimsListPage /> },
  { path: 'claims/new', element: <ClaimCreatePage /> },
  { path: 'claims/:id', element: <ClaimDetailPage /> },
  { path: 'claims/:id/print', element: <ClaimPrintPage /> },
];
