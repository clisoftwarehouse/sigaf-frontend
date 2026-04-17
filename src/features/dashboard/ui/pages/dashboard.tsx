import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

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

      {trend && trend.length > 0 && (
        <Box sx={{ mt: 1.5, mx: -1 }}>
          <KpiSparkline data={trend} color={color} />
        </Box>
      )}
    </Card>
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

  const { data: allLots, isLoading: loadingAllLots } = useLotsQuery({ limit: 1000 });
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

  // ── Bar: lotes por sucursal (top 5) ────────────────────────────────
  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );
  const lotsByBranch = useMemo(() => {
    const lots = allLots?.data ?? [];
    const counts = new Map<string, number>();
    lots.forEach((lot) => {
      counts.set(lot.branchId, (counts.get(lot.branchId) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([branchId, count]) => ({
        branchId,
        name: branchNameById.get(branchId) ?? branchId.slice(0, 8),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allLots, branchNameById]);
  const lotsBarOptions = useChart({
    chart: { type: 'bar' },
    xaxis: {
      categories: lotsByBranch.map((b) => b.name),
      labels: { style: { fontSize: '12px' } },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '60%',
        borderRadiusApplication: 'end',
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v} lotes` } },
    legend: { show: false },
  });
  const lotsBarSeries = [{ name: 'Lotes', data: lotsByBranch.map((b) => b.count) }];

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

        <Typography variant="h6" sx={{ mb: 2 }}>
          Panorama general
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
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

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle2">Top 5 sucursales por lotes</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Lotes registrados en inventario
              </Typography>
              <Box sx={{ mt: 2 }}>
                {loadingAllLots || loadingBranches ? (
                  <Skeleton variant="rounded" height={280} />
                ) : lotsByBranch.length === 0 ? (
                  <Box
                    sx={{
                      height: 280,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    <Typography variant="caption">Sin lotes registrados</Typography>
                  </Box>
                ) : (
                  <Chart type="bar" series={lotsBarSeries} options={lotsBarOptions} height={280} />
                )}
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
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
