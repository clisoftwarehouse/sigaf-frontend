import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const RentabilidadPage = lazy(() => import('./ui/pages/rentabilidad-page'));

export const rentabilidadRoutes: RouteObject[] = [{ path: 'rentabilidad', element: <RentabilidadPage /> }];
