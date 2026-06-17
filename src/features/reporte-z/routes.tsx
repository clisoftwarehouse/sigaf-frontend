import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const ReporteZPage = lazy(() => import('./ui/pages/reporte-z-page'));

export const reporteZRoutes: RouteObject[] = [
  { path: 'reporte-z', element: <ReporteZPage /> },
];
