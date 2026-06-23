import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ReservationsPage = lazy(() => import('./ui/pages/reservations-page'));

export const stockReservationsRoutes: RouteObject[] = [
  { path: 'reservations', element: <ReservationsPage /> },
];
