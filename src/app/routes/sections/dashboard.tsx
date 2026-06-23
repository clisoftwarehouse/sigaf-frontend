import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { paths } from '@/app/routes/paths';
import { CONFIG } from '@/app/global-config';
import { igtfRoutes } from '@/features/igtf/routes';
import { auditRoutes } from '@/features/audit/routes';
import { usersRoutes } from '@/features/users/routes';
import { rolesRoutes } from '@/features/roles/routes';
import { salesRoutes } from '@/features/sales/routes';
import { pricesRoutes } from '@/features/prices/routes';
import { brandsRoutes } from '@/features/brands/routes';
import { claimsRoutes } from '@/features/claims/routes';
import { importsRoutes } from '@/features/imports/routes';
import { DashboardLayout } from '@/app/layouts/dashboard';
import { productsRoutes } from '@/features/products/routes';
import { branchesRoutes } from '@/features/branches/routes';
import { reporteZRoutes } from '@/features/reporte-z/routes';
import { inventoryRoutes } from '@/features/inventory/routes';
import { suppliersRoutes } from '@/features/suppliers/routes';
import { terminalsRoutes } from '@/features/terminals/routes';
import { purchasesRoutes } from '@/features/purchases/routes';
import { customersRoutes } from '@/features/customers/routes';
import { configRoutes } from '@/features/config-global/routes';
import { librosIvaRoutes } from '@/features/libros-iva/routes';
import { warehousesRoutes } from '@/features/warehouses/routes';
import { categoriesRoutes } from '@/features/categories/routes';
import { promotionsRoutes } from '@/features/promotions/routes';
import { LoadingScreen } from '@/app/components/loading-screen';
import { controladosRoutes } from '@/features/controlados/routes';
import { permissionsRoutes } from '@/features/permissions/routes';
import { prescribersRoutes } from '@/features/prescribers/routes';
import { rentabilidadRoutes } from '@/features/rentabilidad/routes';
import { consignmentsRoutes } from '@/features/consignments/routes';
import { cashSessionsRoutes } from '@/features/cash-sessions/routes';
import { branchGroupsRoutes } from '@/features/branch-groups/routes';
import { salesReportsRoutes } from '@/features/sales-reports/routes';
import { AuthGuard, PermissionGuard } from '@/features/auth/ui/guard';
import { prescriptionsRoutes } from '@/features/prescriptions/routes';
import { exchangeRatesRoutes } from '@/features/exchange-rates/routes';
import { paymentsReportRoutes } from '@/features/payments-report/routes';
import { purchaseReportsRoutes } from '@/features/purchase-reports/routes';
import { libroInventarioRoutes } from '@/features/libro-inventario/routes';
import { accountsPayableRoutes } from '@/features/accounts-payable/routes';
import { inventoryReportsRoutes } from '@/features/inventory-reports/routes';
import { activeIngredientsRoutes } from '@/features/active-ingredients/routes';
import { crmFinanceReportsRoutes } from '@/features/crm-finance-reports/routes';
import { inventoryTransfersRoutes } from '@/features/inventory-transfers/routes';
import { purchasesComparatorRoutes } from '@/features/purchases-comparator/routes';
import { purchasesIntelligenceRoutes } from '@/features/purchases-intelligence/routes';

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
          ...inventoryTransfersRoutes,
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
          ...purchasesComparatorRoutes,
          ...purchasesIntelligenceRoutes,
          ...accountsPayableRoutes,
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
          ...warehousesRoutes,
          ...branchGroupsRoutes,
        ],
      },
      {
        path: 'pos',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.pos.customers.root} replace />,
          },
          ...customersRoutes,
          ...prescriptionsRoutes,
          ...prescribersRoutes,
          ...cashSessionsRoutes,
          {
            element: (
              <PermissionGuard permissions={['reports.view']}>
                <Outlet />
              </PermissionGuard>
            ),
            children: [...paymentsReportRoutes],
          },
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, element: <Navigate to={paths.dashboard.admin.users.root} replace /> },
          // Administración del sistema — solo gestión de usuarios (admin).
          {
            element: (
              <PermissionGuard permissions={['admin.users']}>
                <Outlet />
              </PermissionGuard>
            ),
            children: [...usersRoutes, ...rolesRoutes, ...permissionsRoutes, ...configRoutes],
          },
          ...exchangeRatesRoutes,
          ...auditRoutes,
          ...importsRoutes,
          // Cumplimiento SENIAT — gerencia.
          {
            element: (
              <PermissionGuard permissions={['compliance.view']}>
                <Outlet />
              </PermissionGuard>
            ),
            children: [
              ...librosIvaRoutes,
              ...igtfRoutes,
              ...libroInventarioRoutes,
              ...controladosRoutes,
              ...reporteZRoutes,
            ],
          },
          // Reportería gerencial.
          {
            element: (
              <PermissionGuard permissions={['reports.view']}>
                <Outlet />
              </PermissionGuard>
            ),
            children: [
              ...rentabilidadRoutes,
              ...inventoryReportsRoutes,
              ...salesReportsRoutes,
              ...salesRoutes,
              ...purchaseReportsRoutes,
              ...crmFinanceReportsRoutes,
            ],
          },
        ],
      },
    ],
  },
];
