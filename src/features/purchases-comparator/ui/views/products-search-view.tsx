import type { ProductFilters } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';

import { Iconify } from '@/app/components/iconify';

import { formatBs } from '../components/format-money';
import { ProductDetailDrawer } from '../components/product-detail-drawer';
import {
  useComparatorBrandsQuery,
  useComparatorProductsQuery,
  useComparatorProvidersQuery,
  useComparatorCategoriesQuery,
} from '../../api/purchases-comparator.queries';

// ----------------------------------------------------------------------

const LIMIT_OPTIONS = [10, 25, 50];

const SORT_OPTIONS: Array<{ value: NonNullable<ProductFilters['sort']>; label: string }> = [
  { value: 'name', label: 'Nombre A-Z' },
  { value: '-name', label: 'Nombre Z-A' },
  { value: 'bestPrice', label: 'Mejor precio menor' },
  { value: '-bestPrice', label: 'Mejor precio mayor' },
  { value: '-lastSeen', label: 'Más recientes primero' },
  { value: 'lastSeen', label: 'Más antiguos primero' },
];

export function ProductsSearchView() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 25,
    sort: 'bestPrice',
  });
  const [searchInput, setSearchInput] = useState('');
  const [openProduct, setOpenProduct] = useState<string | null>(null);

  const { data: providersData } = useComparatorProvidersQuery({ limit: 200 });
  const { data: categoriesData } = useComparatorCategoriesQuery({ limit: 200 });
  const { data: brandsData } = useComparatorBrandsQuery({ limit: 200 });

  const { data, isLoading, isFetching, isError, error, refetch } = useComparatorProductsQuery(filters);

  const updateFilter = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const applySearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
  };

  const clearSearch = () => {
    setSearchInput('');
    setFilters((prev) => ({ ...prev, search: undefined, page: 1 }));
  };

  return (
    <>
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="stretch">
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por nombre o código de barras…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
              slotProps={{
                input: {
                  endAdornment: searchInput && (
                    <Iconify
                      icon="solar:close-circle-bold"
                      sx={{ ml: 1, cursor: 'pointer', color: 'text.disabled' }}
                      onClick={clearSearch}
                    />
                  ),
                },
              }}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" onClick={applySearch} sx={{ flexShrink: 0 }}>
              Buscar
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            <TextField
              select
              size="small"
              label="Marca"
              value={filters.brand ?? ''}
              onChange={(e) => updateFilter('brand', e.target.value || undefined)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">— Todas —</MenuItem>
              {(brandsData?.data ?? []).map((b) => (
                <MenuItem key={b.name} value={b.name}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Categoría"
              value={filters.category ?? ''}
              onChange={(e) => updateFilter('category', e.target.value || undefined)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">— Todas —</MenuItem>
              {(categoriesData?.data ?? []).map((c) => (
                <MenuItem key={c.name} value={c.name}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Droguería"
              value={filters.provider ?? ''}
              onChange={(e) => updateFilter('provider', e.target.value || undefined)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">— Todas —</MenuItem>
              {(providersData?.data ?? []).map((p) => (
                <MenuItem key={p.name} value={p.name}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Ordenar por"
              value={filters.sort ?? 'bestPrice'}
              onChange={(e) => updateFilter('sort', e.target.value as ProductFilters['sort'])}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 200 }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Por página"
              value={filters.limit ?? 25}
              onChange={(e) => updateFilter('limit', Number(e.target.value))}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 120 }}
            >
              {LIMIT_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Card>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          {(error as Error)?.message ?? 'No se pudo cargar la lista de productos.'}
        </Alert>
      )}

      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="center">Ofertas</TableCell>
                <TableCell align="right">Mejor precio</TableCell>
                <TableCell>Mejor droguería</TableCell>
                <TableCell align="center" sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading &&
                Array.from({ length: filters.limit ?? 25 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={7}>
                      <Skeleton variant="text" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="info" sx={{ my: 2 }}>
                      No se encontraron productos con esos filtros.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                data?.data.map((p) => (
                  <TableRow key={p.externalId} hover>
                    <TableCell sx={{ maxWidth: 320 }}>
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
                    <TableCell>{p.brand || '—'}</TableCell>
                    <TableCell>{p.category || '—'}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" variant="outlined" label={p.offersCount} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {formatBs(p.bestPrice)}
                    </TableCell>
                    <TableCell>{p.bestProvider || '—'}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setOpenProduct(p.externalId)}
                        title="Ver detalle y ofertas"
                      >
                        <Iconify icon="solar:eye-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>

        {data && data.data.length > 0 && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2, borderTop: 1, borderColor: 'divider', opacity: isFetching ? 0.6 : 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              Página {data.pagination.page} de {data.pagination.totalPages} ·{' '}
              {data.pagination.total.toLocaleString('es-VE')} productos
            </Typography>
            <Pagination
              count={data.pagination.totalPages}
              page={data.pagination.page}
              onChange={(_, value) => updateFilter('page', value)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              size="small"
            />
          </Stack>
        )}
      </Card>

      <ProductDetailDrawer
        externalId={openProduct}
        onClose={() => setOpenProduct(null)}
      />
    </>
  );
}
