import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/branches-list-page'));
const CreatePage = lazy(() => import('./ui/pages/branch-create-page'));
const EditPage = lazy(() => import('./ui/pages/branch-edit-page'));

export const branchesRoutes: RouteObject[] = [
  { path: 'branches', element: <ListPage /> },
  { path: 'branches/new', element: <CreatePage /> },
  { path: 'branches/:id/edit', element: <EditPage /> },
];
