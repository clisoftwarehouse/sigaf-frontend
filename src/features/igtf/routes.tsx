import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const IgtfPage = lazy(() => import('./ui/pages/igtf-page'));

export const igtfRoutes: RouteObject[] = [{ path: 'igtf', element: <IgtfPage /> }];
