import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const IvaRetentionsPage = lazy(() => import('./ui/pages/iva-retentions-page'));

export const ivaRetentionsRoutes: RouteObject[] = [
  { path: 'retenciones-iva', element: <IvaRetentionsPage /> },
];
