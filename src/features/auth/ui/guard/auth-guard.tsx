import { useState, useEffect } from 'react';

import { paths } from '@/app/routes/paths';
import { useRouter, usePathname } from '@/app/routes/hooks';
import { SplashScreen } from '@/app/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { authenticated, loading } = useAuthContext();

  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = async (): Promise<void> => {
    if (loading) return;

    if (!authenticated) {
      const queryString = new URLSearchParams({ returnTo: pathname }).toString();
      router.replace(`${paths.auth.signIn}?${queryString}`);
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
