import type { ComparisonGroup } from '../../model/types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';

import { formatBs } from './format-money';

type Props = {
  group: ComparisonGroup;
  onOpenDetail: (ingredient: string) => void;
};

/**
 * Una fila densa por principio activo, pensada para escanear y comparar
 * precios rápido.
 *
 * Columna izquierda: nombre + lab más barato (verde) y más caro (rojo).
 * Centro: chips Mín / Prom / Máx.
 * Derecha: barra visual de spread + brecha %.
 * Acción: flecha → abre el drawer con TODAS las droguerías.
 */
export function ComparisonRow({ group, onOpenDetail }: Props) {
  const { activeIngredient, products, stats, productsCount } = group;

  const cheapest = products[0];
  const mostExpensive = products[products.length - 1];

  const min = stats.minPrice;
  const max = stats.maxPrice;
  const spreadPct = max > 0 && min > 0 ? ((max - min) / max) * 100 : 0;
  const spreadAbs = max - min;

  // Color por brecha — más brecha = más oportunidad = más rojo
  const spreadColor =
    spreadPct >= 50
      ? 'error.main'
      : spreadPct >= 25
        ? 'warning.main'
        : spreadPct >= 10
          ? 'info.main'
          : 'success.main';

  return (
    <TableRow
      hover
      onClick={() => onOpenDetail(activeIngredient)}
      sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
    >
      <TableCell sx={{ width: '28%', maxWidth: 320 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, textTransform: 'uppercase' }}
          noWrap
          title={activeIngredient}
        >
          {activeIngredient}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {productsCount} {productsCount === 1 ? 'laboratorio' : 'laboratorios'}
        </Typography>
      </TableCell>

      <TableCell sx={{ width: '22%' }}>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'success.dark' }}
        >
          {formatBs(min)}
        </Typography>
        {cheapest && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            title={`${cheapest.brand} · ${cheapest.provider}`}
          >
            {cheapest.brand} · {cheapest.provider}
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ width: '22%' }}>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'error.dark' }}
        >
          {formatBs(max)}
        </Typography>
        {mostExpensive && mostExpensive !== cheapest && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            title={`${mostExpensive.brand} · ${mostExpensive.provider}`}
          >
            {mostExpensive.brand} · {mostExpensive.provider}
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ width: '22%' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label={`${spreadPct.toFixed(0)}%`}
            sx={{
              fontWeight: 700,
              minWidth: 50,
              bgcolor: spreadColor,
              color: '#fff',
            }}
          />
          <Box sx={{ flex: 1, minWidth: 60 }}>
            <Box
              sx={{
                width: '100%',
                height: 6,
                bgcolor: 'action.hover',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${Math.min(100, spreadPct)}%`,
                  height: '100%',
                  bgcolor: spreadColor,
                  transition: 'width 0.3s',
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontSize: '0.65rem', mt: 0.25, display: 'block' }}
            >
              Ahorro: {formatBs(spreadAbs)}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell align="center" sx={{ width: 56 }}>
        <Iconify
          icon="solar:double-alt-arrow-right-bold-duotone"
          sx={{ color: 'text.secondary' }}
        />
      </TableCell>
    </TableRow>
  );
}
