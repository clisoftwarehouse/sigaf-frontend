import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/active-ingredients-list-page'));
const CreatePage = lazy(() => import('./ui/pages/active-ingredient-create-page'));
const EditPage = lazy(() => import('./ui/pages/active-ingredient-edit-page'));

export const activeIngredientsRoutes: RouteObject[] = [
  { path: 'active-ingredients', element: <ListPage /> },
  { path: 'active-ingredients/new', element: <CreatePage /> },
  { path: 'active-ingredients/:id/edit', element: <EditPage /> },
];
