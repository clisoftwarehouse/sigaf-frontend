import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const ListPage = lazy(() => import('./ui/pages/transfers-list-page'));
const CreatePage = lazy(() => import('./ui/pages/transfer-create-page'));
const DetailPage = lazy(() => import('./ui/pages/transfer-detail-page'));

export const inventoryTransfersRoutes: RouteObject[] = [
  { path: 'transfers', element: <ListPage /> },
  { path: 'transfers/new', element: <CreatePage /> },
  { path: 'transfers/:id', element: <DetailPage /> },
];
