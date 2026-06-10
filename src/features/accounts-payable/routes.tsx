import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const AccountsPayablePage = lazy(() => import('./ui/pages/accounts-payable-page'));

export const accountsPayableRoutes: RouteObject[] = [
  { path: 'accounts-payable', element: <AccountsPayablePage /> },
];
