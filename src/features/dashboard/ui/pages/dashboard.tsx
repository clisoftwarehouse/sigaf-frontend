import { useMemo } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import SpeedDial from '@mui/material/SpeedDial';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';

import { paths } from '@/app/routes/paths';
import { CONFIG } from '@/app/global-config';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { Chart, useChart } from '@/app/components/chart';
import { useAuthContext } from '@/features/auth/ui/hooks';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';
import { useReceiptsQuery } from '@/features/purchases/api/purchases.queries';
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
  trend?: number[];
};

function KpiSparkline({ data, color }: { data: number[]; color: KpiCardProps['color'] }) {
  const theme = useTheme();
  const colorMap: Record<KpiCardProps['color'], string> = {
    primary: theme.palette.primary.main,
    info: theme.palette.info.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
  };
  const options = useChart({
    chart: { sparkline: { enabled: true } },
    colors: [colorMap[color]],
    stroke: { width: 2, curve: 'smooth' },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] },
    },
    tooltip: { enabled: false },
    legend: { show: false },
  });
  return (
    <Chart
      type="area"
      series={[{ name: 'trend', data }]}
      options={options}
      height={56}
      width="100%"
    />
  );
}

function KpiCard({ label, value, hint, icon, color, href, loading, trend }: KpiCardProps) {
  const router = useRouter();
  return (
    <Card
      sx={(theme) => ({
        p: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: href ? 'pointer' : 'default',
        border: `1px solid ${theme.vars.palette.divider}`,
        transition: theme.transitions.create(['transform', 'box-shadow', 'border-color'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 3,
          height: '100%',
          backgroundColor: theme.vars.palette[color].main,
          opacity: 0.85,
        },
        '&:hover': href
          ? {
              transform: 'translateY(-3px)',
              borderColor: 'transparent',
              boxShadow: theme.customShadows?.z16 ?? theme.shadows[10],
            }
          : undefined,
      })}
      onClick={() => href && router.push(href)}
    >
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Box
          sx={(theme) => ({
            width: 52,
            height: 52,
            borderRadius: 2,
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.vars.palette[color].main,
            background: `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].mainChannel, 0.16)} 0%, ${varAlpha(theme.vars.palette[color].mainChannel, 0.06)} 100%)`,
          })}
        >
          <Iconify icon={icon} width={28} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', letterSpacing: 0.6, fontWeight: 600 }}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={80} sx={{ fontSize: '2.25rem' }} />
          ) : (
            <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700, lineHeight: 1.1 }}>
              {value}
            </Typography>
          )}
          {hint && !loading && (
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>

      {trend && trend.length > 0 && (
        <Box sx={{ mt: 1.5, mx: -1 }}>
          <KpiSparkline data={trend} color={color} />
        </Box>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
      <Box
        sx={(theme) => ({
          width: 4,
          height: 22,
          borderRadius: 1,
          backgroundColor: theme.vars.palette.primary.main,
        })}
      />
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function Page() {
  const theme = useTheme();
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
  const { data: stockData, isLoading: loadingStock } = useStockQuery({
    stockStatus: 'out',
    limit: 1,
  });
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliersQuery({
    isActive: true,
  });

  // Chart queries
  const { data: stockNormal, isLoading: loadingNormal } = useStockQuery({
    stockStatus: 'normal',
    limit: 1,
  });
  const { data: stockLow, isLoading: loadingLow } = useStockQuery({
    stockStatus: 'low',
    limit: 1,
  });
  const { data: stockOut } = useStockQuery({ stockStatus: 'out', limit: 1 });

  const { data: receipts, isLoading: loadingReceipts } = useReceiptsQuery();

  // ── Donut: stock por estado ─────────────────────────────────────────
  const stockDonutSeries = useMemo(
    () => [stockNormal?.total ?? 0, stockLow?.total ?? 0, stockOut?.total ?? 0],
    [stockNormal, stockLow, stockOut]
  );
  const stockDonutTotal = stockDonutSeries.reduce((a, b) => a + b, 0);
  const stockDonutOptions = useChart({
    chart: { type: 'donut' },
    labels: ['Normal', 'Bajo', 'Agotado'],
    colors: [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
    stroke: { width: 0 },
    legend: { position: 'bottom' },
    tooltip: { y: { formatter: (v: number) => `${v} combinaciones` } },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontWeight: 700,
              formatter: () => String(stockDonutTotal),
            },
            value: { fontWeight: 700 },
          },
        },
      },
    },
  });

  // ── Line: recepciones últimos 30 días ──────────────────────────────
  const receiptsTrend = useMemo(() => {
    const days = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));
    receipts?.data.forEach((r) => {
      const dateKey = r.createdAt.slice(0, 10);
      const idx = indexByDate.get(dateKey);
      if (idx != null) buckets[idx].count += 1;
    });
    return buckets;
  }, [receipts]);
  const receiptsLineOptions = useChart({
    chart: { type: 'area' },
    colors: [theme.palette.primary.main],
    stroke: { width: 3, curve: 'smooth' },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] },
    },
    xaxis: {
      type: 'datetime',
      categories: receiptsTrend.map((p) => p.date),
    },
    yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
    tooltip: { x: { format: 'dd MMM yyyy' }, y: { formatter: (v: number) => `${v} recepciones` } },
    legend: { show: false },
  });
  const receiptsLineSeries = [{ name: 'Recepciones', data: receiptsTrend.map((p) => p.count) }];

  return (
    <>
      <title>{metadata.title}</title>

      <Container maxWidth="xl">
        <Card
          sx={{
            position: 'relative',
            overflow: 'hidden',
            mt: 4,
            mb: 4,
            p: { xs: 3, md: 4 },
            color: theme.vars.palette.common.white,
            backgroundColor: '#0F1B2D',
            backgroundImage: `
              radial-gradient(circle at 88% 20%, ${varAlpha('156 28 44', 0.28)} 0px, transparent 45%),
              radial-gradient(circle at 12% 80%, ${varAlpha('255 255 255', 0.08)} 0px, transparent 50%),
              linear-gradient(135deg, #0F1B2D 0%, #1A2C46 60%, #233A56 100%)
            `,
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: `
                linear-gradient(${varAlpha(theme.vars.palette.common.whiteChannel, 0.04)} 1px, transparent 1px),
                linear-gradient(90deg, ${varAlpha(theme.vars.palette.common.whiteChannel, 0.04)} 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              maskImage:
                'radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%)',
            }}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
            spacing={3}
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: varAlpha('255 255 255', 0.6), letterSpacing: 1.4 }}
              >
                {new Date().toLocaleDateString('es-VE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
              <Typography
                variant="h4"
                sx={{ mt: 0.5, fontWeight: 700, color: 'common.white' }}
              >
                {getGreeting()}, {user?.displayName ?? user?.username ?? 'usuario'}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 560,
                  color: varAlpha('255 255 255', 0.72),
                  lineHeight: 1.6,
                }}
              >
                Bienvenido al panel de SIGAF. Aquí tienes un resumen rápido del estado del
                sistema y las alertas operativas más relevantes.
              </Typography>
            </Box>

            {user?.role?.name && (
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  alignSelf: { xs: 'flex-start', md: 'center' },
                  backgroundColor: varAlpha('255 255 255', 0.08),
                  border: `1px solid ${varAlpha('255 255 255', 0.12)}`,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: varAlpha('255 255 255', 0.6), display: 'block' }}
                >
                  Sesión activa como
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ color: 'common.white', fontWeight: 600 }}
                >
                  {user.role.name}
                </Typography>
              </Box>
            )}
          </Stack>
        </Card>

        <SectionHeader title="Resumen del sistema" subtitle="Datos maestros y catálogos" />

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
              href={paths.dashboard.inventory.stock}
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

        <SectionHeader
          title="Alertas de inventario"
          subtitle="Eventos que requieren atención inmediata"
        />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <KpiCard
              label="Lotes vencidos"
              value={expiredLots?.total ?? 0}
              hint="Requieren baja por vencimiento"
              icon="solar:danger-triangle-bold"
              color="error"
              href={paths.dashboard.inventory.stock}
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
              href={paths.dashboard.inventory.stock}
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

        <SectionHeader
          title="Panorama general"
          subtitle="Indicadores clave de inventario y operación"
        />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle2">Estado del stock</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Combinaciones producto × sucursal
              </Typography>
              <Box sx={{ mt: 2 }}>
                {loadingNormal || loadingLow || loadingStock ? (
                  <Skeleton variant="circular" width={260} height={260} sx={{ mx: 'auto' }} />
                ) : stockDonutTotal === 0 ? (
                  <Box
                    sx={{
                      height: 280,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    <Typography variant="caption">Sin datos de stock</Typography>
                  </Box>
                ) : (
                  <Chart
                    type="donut"
                    series={stockDonutSeries}
                    options={stockDonutOptions}
                    height={280}
                  />
                )}
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle2">Recepciones (últimos 30 días)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Movimientos de mercancía entrante
              </Typography>
              <Box sx={{ mt: 2 }}>
                {loadingReceipts ? (
                  <Skeleton variant="rounded" height={280} />
                ) : (
                  <Chart
                    type="area"
                    series={receiptsLineSeries}
                    options={receiptsLineOptions}
                    height={280}
                  />
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>

      </Container>

      <SpeedDial
        ariaLabel="Acciones rápidas"
        icon={<SpeedDialIcon icon={<Iconify icon="solar:add-circle-bold" />} />}
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 32 },
          bottom: { xs: 16, md: 32 },
          '& .MuiFab-primary': {
            width: 60,
            height: 60,
            boxShadow: theme.customShadows?.z16 ?? theme.shadows[8],
          },
        }}
        FabProps={{ color: 'primary' }}
      >
        <SpeedDialAction
          icon={<Iconify icon="solar:box-minimalistic-bold" width={22} />}
          tooltipTitle="Nuevo producto"
          tooltipOpen
          onClick={() => router.push(paths.dashboard.catalog.products.new)}
        />
        <SpeedDialAction
          icon={<Iconify icon="solar:calendar-date-bold" width={22} />}
          tooltipTitle="Nuevo lote"
          tooltipOpen
          onClick={() => router.push(paths.dashboard.inventory.lots.new)}
        />
        <SpeedDialAction
          icon={<Iconify icon="solar:bill-list-bold" width={22} />}
          tooltipTitle="Ver kardex"
          tooltipOpen
          onClick={() => router.push(paths.dashboard.inventory.kardex)}
        />
      </SpeedDial>
    </>
  );
}
