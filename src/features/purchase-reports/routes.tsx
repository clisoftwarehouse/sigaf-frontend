import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const VariacionPreciosPage = lazy(() => import('./ui/pages/variacion-precios-page'));
const NivelServicioPage = lazy(() => import('./ui/pages/nivel-servicio-page'));
const SaldosProveedoresPage = lazy(() => import('./ui/pages/saldos-proveedores-page'));

export const purchaseReportsRoutes: RouteObject[] = [
  { path: 'reportes/variacion-precios', element: <VariacionPreciosPage /> },
  { path: 'reportes/nivel-servicio', element: <NivelServicioPage /> },
  { path: 'reportes/saldos-proveedores', element: <SaldosProveedoresPage /> },
];
