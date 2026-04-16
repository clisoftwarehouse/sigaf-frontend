import type { GridColDef } from '@mui/x-data-grid';
import type { InventoryCount } from '../../model/counts-types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { Chart, useChart } from '@/app/components/chart';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useCountsQuery, useAccuracyQuery } from '../../api/counts.queries';
import {
  COUNT_TYPE_LABEL,
  COUNT_TYPE_OPTIONS,
  COUNT_STATUS_COLOR,
  COUNT_STATUS_LABEL,
  COUNT_STATUS_OPTIONS,
} from '../../model/counts-types';

// ----------------------------------------------------------------------

export function CountsListView() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useCountsQuery({ page: 1, limit: 1000 });
  const counts = data?.data ?? [];

  const { data: accuracy } = useAccuracyQuery();

  const trendOptions = useChart({
    chart: { sparkline: { enabled: false } },
    colors: ['var(--color-success-main, #22c55e)'],
    stroke: { width: 3, curve: 'smooth' },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] },
    },
    xaxis: {
      type: 'datetime',
      categories: accuracy?.trend.map((p) => p.date) ?? [],
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: { formatter: (v: number) => `${v.toFixed(0)}%` },
    },
    tooltip: {
      y: { formatter: (v: number) => `${v.toFixed(2)}%` },
    },
    legend: { show: false },
  });

  const trendSeries = [
    {
      name: 'Precisión',
      data: accuracy?.trend.map((p) => p.accuracyPct) ?? [],
    },
  ];

  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );

  const columns = useMemo<GridColDef<InventoryCount>[]>(
    () => [
      {
        field: 'countNumber',
        headerName: 'Número',
        flex: 1,
        minWidth: 150,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
            {row.countNumber}
          </Typography>
        ),
      },
      {
        field: 'countDate',
        headerName: 'Fecha',
        type: 'date',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        filterOperators: branchFilterOperators,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (branchNameById.get(a) ?? '').localeCompare(branchNameById.get(b) ?? ''),
      },
      {
        field: 'countType',
        headerName: 'Tipo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 130,
        valueOptions: COUNT_TYPE_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            variant="outlined"
            label={COUNT_TYPE_LABEL[row.countType] ?? row.countType}
          />
        ),
      },
      {
        field: 'status',
        headerName: 'Estado',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: COUNT_STATUS_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={COUNT_STATUS_COLOR[row.status]}
            label={COUNT_STATUS_LABEL[row.status]}
          />
        ),
      },
      {
        field: 'totalSkusExpected',
        headerName: 'SKUs esperados',
        type: 'number',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: number | null) => value ?? 0,
      },
      {
        field: 'totalSkusCounted',
        headerName: 'Contados',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | null) => value ?? 0,
      },
      {
        field: 'accuracyPct',
        headerName: 'Precisión',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) =>
          value == null ? null : Number(value),
        valueFormatter: (value: number | null) => (value == null ? '—' : `${value.toFixed(2)}%`),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Ver detalle">
            <IconButton
              onClick={() => router.push(paths.dashboard.inventory.counts.detail(row.id))}
            >
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [router, branchFilterOperators, branchNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Tomas de inventario"
        subtitle="Conteos físicos completos, parciales y cíclicos."
        crumbs={[{ label: 'Inventario' }, { label: 'Tomas' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.inventory.counts.new)}
          >
            Nueva toma
          </Button>
        }
      />

      {accuracy && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Métricas de precisión (tomas aprobadas)
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Precisión promedio
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'success.main' }}>
                    {accuracy.avgAccuracyPct.toFixed(2)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Tomas aprobadas
                  </Typography>
                  <Typography variant="h4">{accuracy.totalCounts}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Ajustes generados
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'warning.main' }}>
                    {accuracy.totalAdjustments}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                Tendencia de precisión
              </Typography>
              {accuracy.trend.length === 0 ? (
                <Box
                  sx={{
                    height: 240,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.disabled',
                  }}
                >
                  <Typography variant="caption">Aún no hay tomas aprobadas</Typography>
                </Box>
              ) : (
                <Chart type="area" series={trendSeries} options={trendOptions} height={240} />
              )}
            </Grid>
          </Grid>
        </Card>
      )}

      <Card>
        {isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar tomas'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={counts}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
