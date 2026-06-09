import type { AbcdClass } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { toNumber } from '../components/format';
import { AbcdChip } from '../components/abcd-chip';
import { useClassifications } from '../../api/intelligence.queries';

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.disabled">
          {subtitle}
        </Typography>
      )}
    </Card>
  );
}

export function IntelligenceDashboardView({ branchId }: { branchId: string }) {
  const { data, isLoading, isError } = useClassifications({ branchId });

  const stats = useMemo(() => {
    if (!data) return null;
    const dist: Record<AbcdClass, number> = { A: 0, B: 0, C: 0, D: 0 };
    let paretoCount = 0;
    let forcedPromotions = 0;
    let expiringRed = 0;
    let neverSold = 0;
    let totalValueAtCost = 0;
    for (const c of data) {
      dist[c.abcdClass]++;
      if (c.isPareto) paretoCount++;
      if (c.forcedPromotionToB) forcedPromotions++;
      if (c.expirySignal === 'RED' || c.expirySignal === 'EXPIRED') expiringRed++;
      if (c.daysSinceLastSale == null) neverSold++;
      const dailyVel = toNumber(c.dailyVelocity);
      const daysOfInv = toNumber(c.daysOfInventory);
      // Aproximación: stock ≈ dailyVelocity * daysOfInventory.
      totalValueAtCost += dailyVel * daysOfInv;
    }
    return { dist, paretoCount, forcedPromotions, expiringRed, neverSold, totalValueAtCost };
  }, [data]);

  if (!branchId) {
    return <Alert severity="info">Elegí una sucursal para ver el dashboard.</Alert>;
  }

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rounded" height={110} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (isError) {
    return <Alert severity="error">No se pudo cargar el dashboard.</Alert>;
  }

  if (!data || data.length === 0) {
    return (
      <Alert severity="warning">
        No hay clasificaciones registradas para esta sucursal. Ejecutá un recálculo desde la pestaña
        Sugerido.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Productos clasificados"
            value={data.length.toLocaleString('es-VE')}
            subtitle="Snapshot vigente del portafolio"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Productos Pareto"
            value={stats?.paretoCount ?? 0}
            subtitle="80/20: SKUs que generan la mayoría del valor"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ascensos forzados a B"
            value={stats?.forcedPromotions ?? 0}
            subtitle="C que son Pareto — revisión gerencial"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Vencimiento crítico"
            value={stats?.expiringRed ?? 0}
            subtitle="Lotes con ≤90 días — compra bloqueada"
          />
        </Grid>
      </Grid>

      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
          Distribución del portafolio
        </Typography>
        <Stack direction="row" spacing={2}>
          {(['A', 'B', 'C', 'D'] as const).map((cls) => {
            const count = stats?.dist[cls] ?? 0;
            const pct = data.length > 0 ? (count / data.length) * 100 : 0;
            return (
              <Stack key={cls} spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
                <AbcdChip abcd={cls} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pct.toFixed(1)}%
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: 'action.hover',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${pct}%`,
                      height: '100%',
                      bgcolor:
                        cls === 'A'
                          ? 'success.main'
                          : cls === 'B'
                          ? 'info.main'
                          : cls === 'C'
                          ? 'warning.main'
                          : 'error.main',
                    }}
                  />
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Card>

      <Alert severity="info" variant="outlined">
        <strong>{stats?.neverSold ?? 0}</strong> productos sin ventas registradas en los últimos 90
        días. Considerá revisar el catálogo y dinamizar o descodificar los que llevan más tiempo
        sin movimiento.
      </Alert>
    </Stack>
  );
}
