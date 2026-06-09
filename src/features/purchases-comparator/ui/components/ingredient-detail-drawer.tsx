import type { ComparisonProduct } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';

import { formatBs } from './format-money';
import { useIngredientComparisonQuery } from '../../api/purchases-comparator.queries';

// ----------------------------------------------------------------------

type Props = {
  ingredient: string | null;
  onClose: () => void;
};

export function IngredientDetailDrawer({ ingredient, onClose }: Props) {
  const [providerFilter, setProviderFilter] = useState<string>('');

  const { data, isLoading, isError, error } = useIngredientComparisonQuery(
    ingredient ?? undefined,
    {
      productsPerIngredient: 50,
    }
  );

  const group = data?.data;
  const products: ComparisonProduct[] = group?.products ?? [];
  const providers = Array.from(new Set(products.map((p) => p.provider))).sort();
  const filtered = providerFilter
    ? products.filter((p) => p.provider === providerFilter)
    : products;

  return (
    <Drawer
      anchor="right"
      open={!!ingredient}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 640 }, p: 0 } } }}
    >
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Principio activo
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              {ingredient ?? '—'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as Error)?.message ?? 'Error al cargar el detalle del principio activo'}
          </Alert>
        )}

        {group && !isLoading && (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`Mín. ${formatBs(group.stats.minPrice)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Prom. ${formatBs(group.stats.avgPrice)}`}
              />
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`Máx. ${formatBs(group.stats.maxPrice)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${group.productsCount} laboratorios`}
              />
            </Stack>

            {providers.length > 1 && (
              <TextField
                select
                size="small"
                label="Filtrar por droguería"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">— Todas ({providers.length}) —</MenuItem>
                {providers.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <Divider sx={{ mb: 1 }} />

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 36 }}>#</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Droguería</TableCell>
                    <TableCell align="right">Precio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((p, idx) => (
                    <TableRow key={`${p.externalId}-${idx}`} hover>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" noWrap title={p.name}>
                          {p.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {p.externalId}
                        </Typography>
                      </TableCell>
                      <TableCell>{p.brand}</TableCell>
                      <TableCell>{p.provider}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: idx === 0 && !providerFilter ? 700 : 500,
                          color: idx === 0 && !providerFilter ? 'success.dark' : 'text.primary',
                        }}
                      >
                        {formatBs(p.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
