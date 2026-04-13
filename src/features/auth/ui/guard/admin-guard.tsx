import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

/**
 * Gate a route behind the `administrador` role. Non-admins see a permission
 * denied screen; unauthenticated users are kicked by the parent `AuthGuard`.
 */

const ADMIN_ROLE = 'administrador';

type Props = {
  children: React.ReactNode;
};

export function AdminGuard({ children }: Props) {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  const isAdmin = user?.role?.name === ADMIN_ROLE;

  useEffect(() => {
    // Silent redirect on first mount if we already know the user isn't admin.
    // Leaving the noisy denied screen only when they navigate there directly.
    if (!loading && user && !isAdmin) {
      // No-op: we'd rather show the message in-place than hijack navigation.
    }
  }, [loading, user, isAdmin]);

  if (loading) return null;

  if (user && !isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning" icon={<Iconify icon="solar:shield-keyhole-bold-duotone" />}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Acceso restringido
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Esta sección solo está disponible para usuarios con rol{' '}
            <strong>administrador</strong>. Tu rol actual:{' '}
            <strong>{user.role?.name ?? 'sin rol'}</strong>.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => router.push(paths.dashboard.root)}
            >
              Volver al dashboard
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
}
