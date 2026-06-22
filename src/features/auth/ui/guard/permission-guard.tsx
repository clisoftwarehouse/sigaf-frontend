import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';

import { usePermissions, useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

/**
 * Gate de ruta por permisos. Permite el acceso si el usuario tiene AL MENOS
 * UNO de los `permissions` (OR lógico, igual que `allowedPermissions` del nav).
 * El `administrador` siempre pasa (ver `usePermissions`).
 *
 * Espeja a `AdminGuard` pero parametrizado por códigos de permiso, para gatear
 * grupos sensibles (reportería gerencial, cumplimiento SENIAT) además del menú.
 */

type Props = {
  permissions: string[];
  children: React.ReactNode;
};

export function PermissionGuard({ permissions, children }: Props) {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const can = usePermissions();

  if (loading) return null;

  if (user && !can.hasAny(...permissions)) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert severity="warning" icon={<Iconify icon="solar:shield-keyhole-bold-duotone" />}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Acceso restringido
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            No tienes permiso para ver esta sección. Tu rol actual:{' '}
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
