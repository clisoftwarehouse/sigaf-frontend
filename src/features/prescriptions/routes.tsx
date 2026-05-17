import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const PrescriptionsListPage = lazy(() => import('./ui/pages/prescriptions-list-page'));
const PrescriptionCreatePage = lazy(() => import('./ui/pages/prescription-create-page'));
const PrescriptionDetailPage = lazy(() => import('./ui/pages/prescription-detail-page'));

export const prescriptionsRoutes: RouteObject[] = [
  { path: 'prescriptions', element: <PrescriptionsListPage /> },
  { path: 'prescriptions/new', element: <PrescriptionCreatePage /> },
  { path: 'prescriptions/:id', element: <PrescriptionDetailPage /> },
];
