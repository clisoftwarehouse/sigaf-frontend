import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ConfigPage = lazy(() => import('./ui/pages/config-page'));

export const configRoutes: RouteObject[] = [{ path: 'config', element: <ConfigPage /> }];
