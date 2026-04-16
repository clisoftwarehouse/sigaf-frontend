import type { ApexOptions } from 'apexcharts';

import { merge } from 'lodash';
import { useMemo } from 'react';

import { useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function useChart(custom?: ApexOptions): ApexOptions {
  const theme = useTheme();

  return useMemo(() => {
    const baseColors = [
      theme.palette.primary.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.success.main,
      theme.palette.primary.dark,
      theme.palette.info.dark,
      theme.palette.warning.dark,
    ];

    const defaults: ApexOptions = {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: theme.palette.text.secondary,
        fontFamily: theme.typography.fontFamily,
        animations: { enabled: true, speed: 360 },
      },
      colors: baseColors,
      states: {
        hover: { filter: { type: 'lighten' } },
        active: { filter: { type: 'darken' } },
      },
      fill: {
        opacity: 1,
        gradient: {
          type: 'vertical',
          shadeIntensity: 0,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        width: 3,
        curve: 'smooth',
        lineCap: 'round',
      },
      grid: {
        strokeDashArray: 3,
        borderColor: theme.palette.divider,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: theme.palette.text.disabled } },
      },
      yaxis: {
        labels: { style: { colors: theme.palette.text.disabled } },
      },
      markers: {
        size: 0,
        strokeColors: theme.palette.background.paper,
      },
      tooltip: {
        theme: theme.palette.mode,
        x: { show: true },
      },
      legend: {
        show: true,
        fontSize: String(13),
        position: 'top',
        horizontalAlign: 'right',
        fontWeight: 500,
        fontFamily: theme.typography.fontFamily,
        itemMargin: { horizontal: 8 },
        labels: { colors: theme.palette.text.primary },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '28%',
          borderRadiusApplication: 'end',
        },
        pie: {
          donut: {
            labels: {
              show: true,
              value: { fontWeight: 700 },
              total: { show: true, fontWeight: 700 },
            },
          },
        },
        radialBar: {
          track: { strokeWidth: '100%', margin: 0 },
          dataLabels: {
            value: { fontWeight: 700 },
            total: { show: true, fontWeight: 700 },
          },
        },
      },
    };

    return custom ? (merge({}, defaults, custom) as ApexOptions) : defaults;
  }, [theme, custom]);
}
