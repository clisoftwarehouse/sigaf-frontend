import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const CustomersListPage = lazy(() => import('./ui/pages/customers-list-page'));
const CustomerCreatePage = lazy(() => import('./ui/pages/customer-create-page'));
const CustomerEditPage = lazy(() => import('./ui/pages/customer-edit-page'));
const CustomerDetailPage = lazy(() => import('./ui/pages/customer-detail-page'));

export const customersRoutes: RouteObject[] = [
  { path: 'customers', element: <CustomersListPage /> },
  { path: 'customers/new', element: <CustomerCreatePage /> },
  { path: 'customers/:id/edit', element: <CustomerEditPage /> },
  { path: 'customers/:id', element: <CustomerDetailPage /> },
];
