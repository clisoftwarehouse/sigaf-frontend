import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/warehouses-list-page'));
const CreatePage = lazy(() => import('./ui/pages/warehouse-create-page'));
const EditPage = lazy(() => import('./ui/pages/warehouse-edit-page'));

export const warehousesRoutes: RouteObject[] = [
  { path: 'warehouses', element: <ListPage /> },
  { path: 'warehouses/new', element: <CreatePage /> },
  { path: 'warehouses/:id/edit', element: <EditPage /> },
];
