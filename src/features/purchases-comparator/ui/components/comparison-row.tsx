import type { ComparisonGroup } from '../../model/types';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';

import { formatBs } from './format-money';

type Props = {
  group: ComparisonGroup;
  onOpenDetail: (ingredient: string) => void;
};

/**
 * Fila de la tabla de comparación por principio activo.
 * Mismo layout que la tabla de "Por producto" — visualmente consistente.
 *
 *   Principio activo · Laboratorios · Mejor precio · Mejor droguería · Brecha
 *
 * Click en cualquier celda abre el drawer con TODAS las droguerías.
 */
export function ComparisonRow({ group, onOpenDetail }: Props) {
  const { activeIngredient, products, stats, productsCount } = group;
  const cheapest = products[0];
  const min = stats.minPrice;
  const max = stats.maxPrice;
  const spreadPct = max > 0 && min > 0 ? ((max - min) / max) * 100 : 0;
  const spreadAbs = max - min;

  const spreadColor: 'success' | 'info' | 'warning' | 'error' =
    spreadPct >= 50 ? 'error' : spreadPct >= 25 ? 'warning' : spreadPct >= 10 ? 'info' : 'success';

  return (
    <TableRow hover>
      <TableCell sx={{ maxWidth: 320 }}>
        <Typography
          variant="body2"
          noWrap
          title={activeIngredient}
          sx={{ fontWeight: 600 }}
        >
          {activeIngredient}
        </Typography>
        {cheapest && (
          <Typography
            variant="caption"
            color="text.disabled"
            noWrap
            sx={{ display: 'block' }}
            title={cheapest.brand}
          >
            {cheapest.brand}
          </Typography>
        )}
      </TableCell>

      <TableCell align="center">
        <Chip size="small" variant="outlined" label={productsCount} />
      </TableCell>

      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
        {formatBs(min)}
      </TableCell>

      <TableCell sx={{ maxWidth: 200 }}>
        <Typography variant="body2" noWrap title={cheapest?.provider}>
          {cheapest?.provider ?? '—'}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack alignItems="flex-end" spacing={0.25}>
          <Chip
            size="small"
            color={spreadColor}
            variant="filled"
            label={`${spreadPct.toFixed(0)}%`}
            sx={{ fontWeight: 700, minWidth: 56 }}
          />
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: '0.65rem' }}
          >
            Ahorro {formatBs(spreadAbs)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell align="center" sx={{ width: 48 }}>
        <IconButton
          size="small"
          onClick={() => onOpenDetail(activeIngredient)}
          title="Ver detalle y todas las droguerías"
        >
          <Iconify icon="solar:eye-bold" width={18} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
