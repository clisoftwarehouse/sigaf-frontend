import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const ReporteXPage = lazy(() => import('./ui/pages/reporte-x-page'));
const DevolucionesPage = lazy(() => import('./ui/pages/devoluciones-page'));
const TransaccionesPage = lazy(() => import('./ui/pages/transacciones-page'));
const TicketPromedioPage = lazy(() => import('./ui/pages/ticket-promedio-page'));
const ProductividadPage = lazy(() => import('./ui/pages/productividad-page'));
const EfectividadPromocionesPage = lazy(() => import('./ui/pages/efectividad-promociones-page'));

export const salesReportsRoutes: RouteObject[] = [
  { path: 'reportes/efectividad-promociones', element: <EfectividadPromocionesPage /> },
  { path: 'reportes/reporte-x', element: <ReporteXPage /> },
  { path: 'reportes/devoluciones', element: <DevolucionesPage /> },
  { path: 'reportes/transacciones', element: <TransaccionesPage /> },
  { path: 'reportes/ticket-promedio', element: <TicketPromedioPage /> },
  { path: 'reportes/productividad', element: <ProductividadPage /> },
];
