import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const AuditLogPage = lazy(() => import('./ui/pages/audit-log-page'));

export const auditRoutes: RouteObject[] = [{ path: 'audit-log', element: <AuditLogPage /> }];
