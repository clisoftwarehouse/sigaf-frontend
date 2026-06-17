import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const RiesgoPage = lazy(() => import('./ui/pages/riesgo-page'));
const MermaPage = lazy(() => import('./ui/pages/merma-page'));
const DiasInventarioPage = lazy(() => import('./ui/pages/dias-inventario-page'));
const CapitalEstancadoPage = lazy(() => import('./ui/pages/capital-estancado-page'));
const ParetoPage = lazy(() => import('./ui/pages/pareto-page'));
const TransferenciasPage = lazy(() => import('./ui/pages/transferencias-page'));

export const inventoryReportsRoutes: RouteObject[] = [
  { path: 'reportes/riesgo', element: <RiesgoPage /> },
  { path: 'reportes/merma', element: <MermaPage /> },
  { path: 'reportes/dias-inventario', element: <DiasInventarioPage /> },
  { path: 'reportes/capital-estancado', element: <CapitalEstancadoPage /> },
  { path: 'reportes/pareto', element: <ParetoPage /> },
  { path: 'reportes/transferencias', element: <TransferenciasPage /> },
];
