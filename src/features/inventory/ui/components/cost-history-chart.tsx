import type { ApexOptions } from 'apexcharts';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { Chart, useChart } from '@/app/components/chart';
import { useBranchOptions } from '@/features/branches/api/branches.options';

import { useProductCostHistoryQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

type Props = {
  productId: string;
};

/**
 * Gráfico de barras: costo de compra en USD (Y) vs fecha (X), una serie por
 * sucursal. Cada barra corresponde a una línea de recepción (lo que pagamos).
 *
 * El backend devuelve un arreglo plano `[{ branchId, date, costUsd }]`
 * ordenado por fecha ascendente. Agrupamos por sucursal y armamos una serie
 * ApexCharts por cada una.
 */
export function CostHistoryChart({ productId }: Props) {
  const { data, isLoading, isError, error } = useProductCostHistoryQuery(productId);
  const { data: branchOpts = [] } = useBranchOptions();

  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const series = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Agrupa entries por sucursal.
    const byBranch = new Map<string, { x: number; y: number }[]>();
    for (const entry of data) {
      const t = new Date(entry.date).getTime();
      if (!Number.isFinite(t)) continue;
      const arr = byBranch.get(entry.branchId) ?? [];
      arr.push({ x: t, y: Number(entry.costUsd) });
      byBranch.set(entry.branchId, arr);
    }

    return Array.from(byBranch.entries())
      .map(([branchId, points]) => ({
        name: branchNameById.get(branchId) ?? branchId,
        data: points.sort((a, b) => a.x - b.x),
      }))
      .sort((a, b) => b.data.length - a.data.length);
  }, [data, branchNameById]);

  const chartOptions = useChart({
    chart: { type: 'line' },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false },
    },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
      y: {
        formatter: (v: number) =>
          `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      markers: { size: 6 },
    },
    stroke: { curve: 'straight', width: 2 },
    markers: { size: 3, hover: { size: 5 } },
  } as ApexOptions);

  if (isError) {
    return (
      <Alert severity="warning" sx={{ my: 1 }}>
        {(error as Error)?.message ?? 'No se pudo cargar el historial de costos.'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Costo de compra (USD) en el tiempo
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Una serie por sucursal. Cada barra corresponde a una recepción de mercancía.
      </Typography>
      <Chart
        type="line"
        height={280}
        loading={isLoading}
        series={series}
        options={chartOptions}
        empty={
          <Typography variant="caption" color="text.disabled">
            Aún no hay recepciones de mercancía registradas para este producto.
          </Typography>
        }
      />
    </Box>
  );
}
