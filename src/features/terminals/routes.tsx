import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/terminals-list-page'));
const CreatePage = lazy(() => import('./ui/pages/terminal-create-page'));
const EditPage = lazy(() => import('./ui/pages/terminal-edit-page'));

export const terminalsRoutes: RouteObject[] = [
  { path: 'terminals', element: <ListPage /> },
  { path: 'terminals/new', element: <CreatePage /> },
  { path: 'terminals/:id/edit', element: <EditPage /> },
];
