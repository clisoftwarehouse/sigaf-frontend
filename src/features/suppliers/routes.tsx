import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/suppliers-list-page'));
const CreatePage = lazy(() => import('./ui/pages/supplier-create-page'));
const EditPage = lazy(() => import('./ui/pages/supplier-edit-page'));

export const suppliersRoutes: RouteObject[] = [
  { path: 'suppliers', element: <ListPage /> },
  { path: 'suppliers/new', element: <CreatePage /> },
  { path: 'suppliers/:id/edit', element: <EditPage /> },
];
