import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const BrandsListPage = lazy(() => import('./ui/pages/brands-list-page'));
const BrandCreatePage = lazy(() => import('./ui/pages/brand-create-page'));
const BrandEditPage = lazy(() => import('./ui/pages/brand-edit-page'));

export const brandsRoutes: RouteObject[] = [
  { path: 'brands', element: <BrandsListPage /> },
  { path: 'brands/new', element: <BrandCreatePage /> },
  { path: 'brands/:id/edit', element: <BrandEditPage /> },
];
