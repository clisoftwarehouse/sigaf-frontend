import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const LibroInventarioPage = lazy(() => import('./ui/pages/libro-inventario-page'));

export const libroInventarioRoutes: RouteObject[] = [
  { path: 'libro-inventario', element: <LibroInventarioPage /> },
];
