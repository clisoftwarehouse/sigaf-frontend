import { QueryClient } from '@tanstack/react-query';

/**
 * Backend está en Render free tier y entra en sleep tras 15min de inactividad.
 * El cold start puede tomar hasta 30s — durante ese tiempo la primera query
 * falla (timeout o 503). Ajustamos defaults para tolerarlo:
 *
 * - `retry: 3` con backoff exponencial (1s, 2s, 4s) para sobrevivir el cold start.
 * - `refetchOnWindowFocus: true` para re-traer datos cuando el usuario vuelve
 *   al tab (típicamente después de un rato → backend dormido). Con
 *   `staleTime: 60s` no es intrusivo: solo refetchea si pasó más de 1min.
 * - `refetchOnReconnect: true` (default) para recuperar tras pérdida de red.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    },
    mutations: {
      retry: 0,
    },
  },
});
