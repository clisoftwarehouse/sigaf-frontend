import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/locations-list-page'));
const CreatePage = lazy(() => import('./ui/pages/location-create-page'));
const EditPage = lazy(() => import('./ui/pages/location-edit-page'));

export const locationsRoutes: RouteObject[] = [
  { path: 'locations', element: <ListPage /> },
  { path: 'locations/new', element: <CreatePage /> },
  { path: 'locations/:id/edit', element: <EditPage /> },
];
