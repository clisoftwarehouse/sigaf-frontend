import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/roles-list-page'));
const CreatePage = lazy(() => import('./ui/pages/role-create-page'));
const EditPage = lazy(() => import('./ui/pages/role-edit-page'));

export const rolesRoutes: RouteObject[] = [
  { path: 'roles', element: <ListPage /> },
  { path: 'roles/new', element: <CreatePage /> },
  { path: 'roles/:id/edit', element: <EditPage /> },
];
