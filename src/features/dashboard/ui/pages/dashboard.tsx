import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { CONFIG } from '@/app/global-config';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { useAuthContext } from '@/features/auth/ui/hooks';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';
import { useLotsQuery, useStockQuery } from '@/features/inventory/api/inventory.queries';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard · ${CONFIG.appName}` };

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentProps<typeof Iconify>['icon'];
  color: 'primary' | 'info' | 'success' | 'warning' | 'error';
  href?: string;
  loading?: boolean;
};

function KpiCard({ label, value, hint, icon, color, href, loading }: KpiCardProps) {
  const router = useRouter();
  return (
    <Card
      sx={{
        p: 3,
        cursor: href ? 'pointer' : 'default',
        transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
        '&:hover': href
          ? { transform: 'translateY(-2px)', boxShadow: (theme) => theme.shadows[8] }
          : undefined,
      }}
      onClick={() => href && router.push(href)}
    >
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
          }}
        >
          <Iconify icon={icon} width={26} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={60} sx={{ fontSize: '2rem' }} />
          ) : (
            <Typography variant="h4" sx={{ mt: 0.25 }}>
              {value}
            </Typography>
          )}
          {hint && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();
  const router = useRouter();

  // All queries use minimal limit since we only need the `total` count.
  const { data: productsData, isLoading: loadingProducts } = useProductsQuery({ limit: 1 });
  const { data: lotsData, isLoading: loadingLots } = useLotsQuery({ limit: 1 });
  const { data: expiredLots, isLoading: loadingExpired } = useLotsQuery({
    limit: 1,
    expirySignal: 'EXPIRED',
  });
  const { data: redLots, isLoading: loadingRed } = useLotsQuery({ limit: 1, expirySignal: 'RED' });
  const { data: stockData, isLoading: loadingStock } = useStockQuery({ stockStatus: 'out', limit: 1 });
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliersQuery({
    isActive: true,
  });

  return (
    <>
      <title>{metadata.title}</title>

      <Container maxWidth="xl">
        <Box sx={{ py: 5 }}>
          <Typography variant="h4">
            Hola, {user?.displayName ?? user?.username ?? 'usuario'} 👋
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
            Bienvenido al panel de SIGAF. Aquí tienes un resumen rápido del estado del sistema.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              label="Productos activos"
              value={productsData?.total ?? 0}
              icon="solar:box-minimalistic-bold"
              color="primary"
              href={paths.dashboard.catalog.products.root}
              loading={loadingProducts}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              label="Lotes en inventario"
              value={lotsData?.total ?? 0}
              icon="solar:calendar-date-bold"
              color="info"
              href={paths.dashboard.inventory.lots.root}
              loading={loadingLots}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              label="Sucursales"
              value={branches.length}
              icon="solar:home-angle-bold-duotone"
              color="success"
              href={paths.dashboard.organization.branches.root}
              loading={loadingBranches}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              label="Proveedores activos"
              value={suppliers.length}
              icon="solar:case-minimalistic-bold"
              color="info"
              href={paths.dashboard.catalog.suppliers.root}
              loading={loadingSuppliers}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Alertas de inventario
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <KpiCard
              label="Lotes vencidos"
              value={expiredLots?.total ?? 0}
              hint="Requieren baja por vencimiento"
              icon="solar:danger-triangle-bold"
              color="error"
              href={paths.dashboard.inventory.lots.root}
              loading={loadingExpired}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <KpiCard
              label="Lotes por vencer (≤ 30 días)"
              value={redLots?.total ?? 0}
              hint="Priorizar venta vía FEFO"
              icon="solar:clock-circle-bold"
              color="warning"
              href={paths.dashboard.inventory.lots.root}
              loading={loadingRed}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <KpiCard
              label="Productos agotados"
              value={stockData?.total ?? 0}
              hint="Sin stock disponible"
              icon="solar:bell-off-bold"
              color="warning"
              href={paths.dashboard.inventory.stock}
              loading={loadingStock}
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle1">Acciones rápidas</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Accesos directos a las operaciones más comunes.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => router.push(paths.dashboard.catalog.products.new)}
              >
                Nuevo producto
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => router.push(paths.dashboard.inventory.lots.new)}
              >
                Nuevo lote
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:bill-list-bold" />}
                onClick={() => router.push(paths.dashboard.inventory.kardex)}
              >
                Ver kardex
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </>
  );
}
