import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const PaymentsReportPage = lazy(() => import('./ui/pages/payments-report-page'));

export const paymentsReportRoutes: RouteObject[] = [
  { path: 'payments-report', element: <PaymentsReportPage /> },
];
