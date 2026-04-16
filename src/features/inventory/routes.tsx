import type { RouteObject } from 'react-router';

import { lazy } from 'react';

import { AdminGuard } from '@/features/auth/ui/guard';

// ----------------------------------------------------------------------

const StockPage = lazy(() => import('./ui/pages/stock-page'));
const LotsListPage = lazy(() => import('./ui/pages/lots-list-page'));
const LotCreatePage = lazy(() => import('./ui/pages/lot-create-page'));
const LotEditPage = lazy(() => import('./ui/pages/lot-edit-page'));
const ProductDetailPage = lazy(() => import('./ui/pages/product-detail-page'));
const KardexPage = lazy(() => import('./ui/pages/kardex-page'));
const CountsListPage = lazy(() => import('./ui/pages/counts-list-page'));
const CountCreatePage = lazy(() => import('./ui/pages/count-create-page'));
const CountDetailPage = lazy(() => import('./ui/pages/count-detail-page'));
const CyclicSchedulesPage = lazy(() => import('./ui/pages/cyclic-schedules-page'));

export const inventoryRoutes: RouteObject[] = [
  { path: 'stock', element: <StockPage /> },
  { path: 'lots', element: <LotsListPage /> },
  { path: 'lots/new', element: <LotCreatePage /> },
  { path: 'lots/:id/edit', element: <LotEditPage /> },
  { path: 'products/:id', element: <ProductDetailPage /> },
  { path: 'counts', element: <CountsListPage /> },
  { path: 'counts/new', element: <CountCreatePage /> },
  { path: 'counts/:id', element: <CountDetailPage /> },
  { path: 'cyclic-schedules', element: <CyclicSchedulesPage /> },
  {
    path: 'kardex',
    element: (
      <AdminGuard>
        <KardexPage />
      </AdminGuard>
    ),
  },
];
