import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/users-list-page'));
const CreatePage = lazy(() => import('./ui/pages/user-create-page'));
const EditPage = lazy(() => import('./ui/pages/user-edit-page'));

export const usersRoutes: RouteObject[] = [
  { path: 'users', element: <ListPage /> },
  { path: 'users/new', element: <CreatePage /> },
  { path: 'users/:id/edit', element: <EditPage /> },
];
