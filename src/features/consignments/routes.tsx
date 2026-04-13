import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const EntriesListPage = lazy(() => import('./ui/pages/entries-list-page'));
const EntryCreatePage = lazy(() => import('./ui/pages/entry-create-page'));
const EntryDetailPage = lazy(() => import('./ui/pages/entry-detail-page'));
const ReturnsListPage = lazy(() => import('./ui/pages/returns-list-page'));
const ReturnCreatePage = lazy(() => import('./ui/pages/return-create-page'));
const LiquidationsListPage = lazy(() => import('./ui/pages/liquidations-list-page'));
const LiquidationCreatePage = lazy(() => import('./ui/pages/liquidation-create-page'));
const LiquidationDetailPage = lazy(() => import('./ui/pages/liquidation-detail-page'));

export const consignmentsRoutes: RouteObject[] = [
  { path: 'entries', element: <EntriesListPage /> },
  { path: 'entries/new', element: <EntryCreatePage /> },
  { path: 'entries/:id', element: <EntryDetailPage /> },
  { path: 'returns', element: <ReturnsListPage /> },
  { path: 'returns/new', element: <ReturnCreatePage /> },
  { path: 'liquidations', element: <LiquidationsListPage /> },
  { path: 'liquidations/new', element: <LiquidationCreatePage /> },
  { path: 'liquidations/:id', element: <LiquidationDetailPage /> },
];
