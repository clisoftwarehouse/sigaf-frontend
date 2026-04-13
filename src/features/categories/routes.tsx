import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const CategoriesListPage = lazy(() => import('./ui/pages/categories-list-page'));
const CategoryCreatePage = lazy(() => import('./ui/pages/category-create-page'));
const CategoryEditPage = lazy(() => import('./ui/pages/category-edit-page'));

export const categoriesRoutes: RouteObject[] = [
  { path: 'categories', element: <CategoriesListPage /> },
  { path: 'categories/new', element: <CategoryCreatePage /> },
  { path: 'categories/:id/edit', element: <CategoryEditPage /> },
];
