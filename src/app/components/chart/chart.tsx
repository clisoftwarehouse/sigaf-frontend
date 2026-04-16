import type { ApexOptions } from 'apexcharts';
import type { Theme, SxProps } from '@mui/material/styles';

import ReactApexChart from 'react-apexcharts';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'candlestick'
  | 'boxPlot'
  | 'radar'
  | 'polarArea'
  | 'rangeBar'
  | 'rangeArea'
  | 'treemap';

export interface ChartProps {
  type: ChartType;
  series: ApexOptions['series'];
  options?: ApexOptions;
  width?: string | number;
  height?: string | number;
  loading?: boolean;
  empty?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const hasData = (series: ApexOptions['series']): boolean => {
  if (!series) return false;
  if (!Array.isArray(series) || series.length === 0) return false;
  return series.some((item) => {
    if (typeof item === 'number') return true;
    if (item && typeof item === 'object' && 'data' in item) {
      const data = (item as { data?: unknown[] }).data;
      return Array.isArray(data) && data.length > 0;
    }
    return false;
  });
};

export function Chart({
  type,
  series,
  options,
  width = '100%',
  height = 320,
  loading = false,
  empty,
  sx,
}: ChartProps) {
  if (loading) {
    return (
      <Box sx={{ width, ...sx }}>
        <Skeleton variant="rounded" height={Number(height) || 320} />
      </Box>
    );
  }

  if (!hasData(series)) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.disabled',
          ...sx,
        }}
      >
        {empty ?? <Typography variant="caption">Sin datos para mostrar</Typography>}
      </Box>
    );
  }

  return (
    <Box sx={{ width, ...sx }}>
      <ReactApexChart
        type={type}
        series={series as ApexOptions['series']}
        options={options ?? {}}
        width={width}
        height={height}
      />
    </Box>
  );
}
