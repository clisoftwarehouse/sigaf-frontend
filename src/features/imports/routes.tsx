import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ImportsPage = lazy(() => import('./ui/pages/imports-page'));

export const importsRoutes: RouteObject[] = [{ path: 'imports', element: <ImportsPage /> }];
