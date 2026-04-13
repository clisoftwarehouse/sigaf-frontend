import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/permissions-list-page'));

export const permissionsRoutes: RouteObject[] = [{ path: 'permissions', element: <ListPage /> }];
