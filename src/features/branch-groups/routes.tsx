import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const BranchGroupsListPage = lazy(() => import('./ui/pages/branch-groups-list-page'));
const BranchGroupCreatePage = lazy(() => import('./ui/pages/branch-group-create-page'));
const BranchGroupEditPage = lazy(() => import('./ui/pages/branch-group-edit-page'));

export const branchGroupsRoutes: RouteObject[] = [
  { path: 'branch-groups', element: <BranchGroupsListPage /> },
  { path: 'branch-groups/new', element: <BranchGroupCreatePage /> },
  { path: 'branch-groups/:id/edit', element: <BranchGroupEditPage /> },
];
