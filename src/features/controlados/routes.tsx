import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const ControladosPage = lazy(() => import('./ui/pages/controlados-page'));

export const controladosRoutes: RouteObject[] = [{ path: 'controlados', element: <ControladosPage /> }];
