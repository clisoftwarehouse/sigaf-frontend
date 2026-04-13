import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { GuestGuard } from '@/features/auth/ui/guard';
import { AuthSplitLayout } from '@/app/layouts/auth-split';
import { SplashScreen } from '@/app/components/loading-screen';

// ----------------------------------------------------------------------

const SignInPage = lazy(() => import('@/features/auth/ui/pages/sign-in'));

const authJwt = {
  path: 'jwt',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout
            slotProps={{
              section: { title: 'Bienvenido a SIGAF' },
            }}
          >
            <SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
  ],
};

export const authRoutes: RouteObject[] = [
  {
    path: 'auth',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authJwt],
  },
];
