import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/roles-list-page'));

export const rolesRoutes: RouteObject[] = [{ path: 'roles', element: <ListPage /> }];
