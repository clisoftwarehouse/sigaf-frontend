import type { ApexOptions } from 'apexcharts';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { Chart, useChart } from '@/app/components/chart';

import { useComparatorProductHistoryQuery } from '../../api/purchases-comparator.queries';

// ----------------------------------------------------------------------

type Props = {
  externalId: string;
  productName?: string;
};

/**
 * Gráfico de líneas: precio en bolívares (Y) vs fecha (X), una línea por
 * droguería. Útil para detectar tendencias de costo antes de comprar.
 *
 * El backend devuelve `{ data: [{ provider, price, date }], pagination }`.
 * Agrupamos por droguería y armamos una serie ApexCharts por cada una.
 */
export function PriceHistoryChart({ externalId, productName }: Props) {
  const { data, isLoading, isError, error } = useComparatorProductHistoryQuery(externalId, {
    limit: 100,
  });

  const series = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];

    // Agrupa entries por droguería.
    const byProvider = new Map<string, { x: number; y: number }[]>();
    for (const entry of data.data) {
      const t = new Date(entry.date).getTime();
      if (!Number.isFinite(t)) continue;
      const arr = byProvider.get(entry.provider) ?? [];
      arr.push({ x: t, y: Number(entry.price) });
      byProvider.set(entry.provider, arr);
    }

    // Ordena por fecha ascendente cada serie y convierte a formato ApexCharts.
    return Array.from(byProvider.entries())
      .map(([provider, points]) => ({
        name: provider,
        data: points.sort((a, b) => a.x - b.x),
      }))
      // Las droguerías con más puntos primero (más relevantes visualmente).
      .sort((a, b) => b.data.length - a.data.length);
  }, [data]);

  const chartOptions = useChart({
    chart: { type: 'line' },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false },
    },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          `Bs. ${v.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
      y: {
        formatter: (v: number) =>
          `Bs. ${v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
        {(error as Error)?.message ?? 'No se pudo cargar el historial de precios.'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Historial de precios
      </Typography>
      {productName && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {productName}
        </Typography>
      )}
      <Chart
        type="line"
        height={280}
        loading={isLoading}
        series={series}
        options={chartOptions}
        empty={
          <Typography variant="caption" color="text.disabled">
            Aún no hay suficientes movimientos de precio registrados para este producto.
          </Typography>
        }
      />
    </Box>
  );
}
