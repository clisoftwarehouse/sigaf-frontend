import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/products-list-page'));
const CreatePage = lazy(() => import('./ui/pages/product-create-page'));
const EditPage = lazy(() => import('./ui/pages/product-edit-page'));

export const productsRoutes: RouteObject[] = [
  { path: 'products', element: <ListPage /> },
  { path: 'products/new', element: <CreatePage /> },
  { path: 'products/:id/edit', element: <EditPage /> },
];
