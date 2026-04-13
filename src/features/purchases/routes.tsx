import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const OrdersListPage = lazy(() => import('./ui/pages/orders-list-page'));
const OrderCreatePage = lazy(() => import('./ui/pages/order-create-page'));
const OrderDetailPage = lazy(() => import('./ui/pages/order-detail-page'));
const ReceiptsListPage = lazy(() => import('./ui/pages/receipts-list-page'));
const ReceiptCreatePage = lazy(() => import('./ui/pages/receipt-create-page'));
const ReceiptDetailPage = lazy(() => import('./ui/pages/receipt-detail-page'));

export const purchasesRoutes: RouteObject[] = [
  { path: 'orders', element: <OrdersListPage /> },
  { path: 'orders/new', element: <OrderCreatePage /> },
  { path: 'orders/:id', element: <OrderDetailPage /> },
  { path: 'receipts', element: <ReceiptsListPage /> },
  { path: 'receipts/new', element: <ReceiptCreatePage /> },
  { path: 'receipts/:id', element: <ReceiptDetailPage /> },
];
