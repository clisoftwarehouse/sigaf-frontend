import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const CustomersListPage = lazy(() => import('./ui/pages/customers-list-page'));
const CustomerCreatePage = lazy(() => import('./ui/pages/customer-create-page'));
const CustomerEditPage = lazy(() => import('./ui/pages/customer-edit-page'));

export const customersRoutes: RouteObject[] = [
  { path: 'customers', element: <CustomersListPage /> },
  { path: 'customers/new', element: <CustomerCreatePage /> },
  { path: 'customers/:id/edit', element: <CustomerEditPage /> },
];
