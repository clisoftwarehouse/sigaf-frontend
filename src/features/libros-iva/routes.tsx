import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const LibrosIvaPage = lazy(() => import('./ui/pages/libros-iva-page'));

export const librosIvaRoutes: RouteObject[] = [
  { path: 'libros-iva', element: <LibrosIvaPage /> },
];
