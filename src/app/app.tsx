import './global.css';

import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { usePathname } from '@/app/routes/hooks';
import { queryClient } from '@/shared/lib/query-client';
import { ProgressBar } from '@/app/components/progress-bar';
import { AuthProvider } from '@/features/auth/ui/context/jwt';
import { themeConfig, ThemeProvider } from '@/app/ui-kit/theme';
import { MotionLazy } from '@/app/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from '@/app/components/settings';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider defaultSettings={defaultSettings}>
          <ThemeProvider
            modeStorageKey={themeConfig.modeStorageKey}
            defaultMode={themeConfig.defaultMode}
          >
            <MotionLazy>
              <ProgressBar />
              <SettingsDrawer defaultSettings={defaultSettings} />
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{ duration: 4000 }}
              />
              {children}
            </MotionLazy>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
