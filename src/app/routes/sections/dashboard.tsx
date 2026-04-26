import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { paths } from '@/app/routes/paths';
import { CONFIG } from '@/app/global-config';
import { AuthGuard } from '@/features/auth/ui/guard';
import { auditRoutes } from '@/features/audit/routes';
import { usersRoutes } from '@/features/users/routes';
import { rolesRoutes } from '@/features/roles/routes';
import { pricesRoutes } from '@/features/prices/routes';
import { brandsRoutes } from '@/features/brands/routes';
import { claimsRoutes } from '@/features/claims/routes';
import { importsRoutes } from '@/features/imports/routes';
import { DashboardLayout } from '@/app/layouts/dashboard';
import { productsRoutes } from '@/features/products/routes';
import { branchesRoutes } from '@/features/branches/routes';
import { inventoryRoutes } from '@/features/inventory/routes';
import { suppliersRoutes } from '@/features/suppliers/routes';
import { terminalsRoutes } from '@/features/terminals/routes';
import { locationsRoutes } from '@/features/locations/routes';
import { purchasesRoutes } from '@/features/purchases/routes';
import { configRoutes } from '@/features/config-global/routes';
import { categoriesRoutes } from '@/features/categories/routes';
import { promotionsRoutes } from '@/features/promotions/routes';
import { LoadingScreen } from '@/app/components/loading-screen';
import { permissionsRoutes } from '@/features/permissions/routes';
import { consignmentsRoutes } from '@/features/consignments/routes';
import { exchangeRatesRoutes } from '@/features/exchange-rates/routes';
import { activeIngredientsRoutes } from '@/features/active-ingredients/routes';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('@/features/dashboard/ui/pages/dashboard'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      {
        path: 'catalog',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.catalog.products.root} replace />,
          },
          ...productsRoutes,
          ...brandsRoutes,
          ...categoriesRoutes,
          ...activeIngredientsRoutes,
          ...suppliersRoutes,
          ...pricesRoutes,
          ...promotionsRoutes,
        ],
      },
      {
        path: 'inventory',
        children: [
          { index: true, element: <Navigate to={paths.dashboard.inventory.stock} replace /> },
          ...inventoryRoutes,
        ],
      },
      {
        path: 'purchases',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.purchases.orders.root} replace />,
          },
          ...purchasesRoutes,
        ],
      },
      ...claimsRoutes,
      {
        path: 'consignments',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.consignments.entries.root} replace />,
          },
          ...consignmentsRoutes,
        ],
      },
      {
        path: 'organization',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.organization.branches.root} replace />,
          },
          ...branchesRoutes,
          ...terminalsRoutes,
          ...locationsRoutes,
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, element: <Navigate to={paths.dashboard.admin.users.root} replace /> },
          ...usersRoutes,
          ...rolesRoutes,
          ...permissionsRoutes,
          ...configRoutes,
          ...exchangeRatesRoutes,
          ...auditRoutes,
          ...importsRoutes,
        ],
      },
    ],
  },
];
