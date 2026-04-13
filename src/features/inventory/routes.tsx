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

export const inventoryRoutes: RouteObject[] = [
  { path: 'stock', element: <StockPage /> },
  { path: 'lots', element: <LotsListPage /> },
  { path: 'lots/new', element: <LotCreatePage /> },
  { path: 'lots/:id/edit', element: <LotEditPage /> },
  { path: 'products/:id', element: <ProductDetailPage /> },
  {
    path: 'kardex',
    element: (
      <AdminGuard>
        <KardexPage />
      </AdminGuard>
    ),
  },
];
