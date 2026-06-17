import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const PacientesCronicosPage = lazy(() => import('./ui/pages/pacientes-cronicos-page'));
const ComportamientoClientesPage = lazy(() => import('./ui/pages/comportamiento-clientes-page'));
const FlujoCajaPage = lazy(() => import('./ui/pages/flujo-caja-page'));

export const crmFinanceReportsRoutes: RouteObject[] = [
  { path: 'reportes/pacientes-cronicos', element: <PacientesCronicosPage /> },
  { path: 'reportes/comportamiento-clientes', element: <ComportamientoClientesPage /> },
  { path: 'reportes/flujo-caja', element: <FlujoCajaPage /> },
];
