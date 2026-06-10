import type { ComparisonFilters } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';

import { ComparisonRow } from '../components/comparison-row';
import { IngredientDetailDrawer } from '../components/ingredient-detail-drawer';
import {
  useComparisonQuery,
  useComparatorBrandsQuery,
  useComparatorProvidersQuery,
  useComparatorCategoriesQuery,
} from '../../api/purchases-comparator.queries';

// ----------------------------------------------------------------------

const LIMIT_OPTIONS = [12, 24, 48];

export function ComparisonView() {
  const [filters, setFilters] = useState<ComparisonFilters>({
    page: 1,
    limit: 24,
    priceType: 'con_iva',
  });
  const [searchInput, setSearchInput] = useState('');
  const [openIngredient, setOpenIngredient] = useState<string | null>(null);

  const { data: providersData } = useComparatorProvidersQuery({ limit: 200 });
  const { data: categoriesData } = useComparatorCategoriesQuery({ limit: 200 });
  const { data: brandsData } = useComparatorBrandsQuery({ limit: 200 });

  const { data, isLoading, isFetching, isError, error, refetch } = useComparisonQuery(filters);

  const updateFilter = <K extends keyof ComparisonFilters>(key: K, value: ComparisonFilters[K]) => {
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
              placeholder="Buscar principio activo (ej. ACETAMINOFEN, IBUPROFENO)…"
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

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              select
              size="small"
              label="Tipo de precio"
              value={filters.priceType ?? 'con_iva'}
              onChange={(e) => updateFilter('priceType', e.target.value as 'con_iva' | 'sin_iva')}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="con_iva">Con IVA</MenuItem>
              <MenuItem value="sin_iva">Sin IVA</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Por página"
              value={filters.limit ?? 24}
              onChange={(e) => updateFilter('limit', Number(e.target.value))}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 130 }}
            >
              {LIMIT_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={!!filters.onlyMultiple}
                  onChange={(e) => updateFilter('onlyMultiple', e.target.checked || undefined)}
                />
              }
              label="Solo con 2 o más laboratorios"
              sx={{ ml: 0 }}
            />

            <Box sx={{ flex: 1 }} />

            {providersData && (
              <Typography variant="caption" color="text.disabled">
                {providersData.data.length} droguerías · {categoriesData?.data.length ?? 0} categorías ·{' '}
                {brandsData?.data.length ?? 0} marcas
              </Typography>
            )}
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
          {(error as Error)?.message ??
            'No se pudo cargar el comparador. Verificá que PRODUCT_API_IC_KEY esté seteado en el backend.'}
        </Alert>
      )}

      {(isLoading || (isFetching && !data)) && (
        <Stack spacing={1}>
          {Array.from({ length: Math.min(filters.limit ?? 24, 12) }).map((_, idx) => (
            <Skeleton key={idx} variant="rounded" height={56} />
          ))}
        </Stack>
      )}

      {data && data.data.length === 0 && (
        <Alert severity="info">
          No se encontraron principios activos con esos filtros. Probá ajustar la búsqueda.
        </Alert>
      )}

      {data && data.data.length > 0 && (
        <>
          <Card sx={{ overflow: 'hidden', mb: 3, opacity: isFetching ? 0.6 : 1 }}>
            <Box sx={{ overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Principio activo</TableCell>
                    <TableCell>Mínimo</TableCell>
                    <TableCell>Máximo</TableCell>
                    <TableCell>Brecha</TableCell>
                    <TableCell align="center" sx={{ width: 56 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((group) => (
                    <ComparisonRow
                      key={group.activeIngredient}
                      group={group}
                      onOpenDetail={(name) => setOpenIngredient(name)}
                    />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="caption" color="text.secondary">
              Página {data.pagination.page} de {data.pagination.totalPages} ·{' '}
              {data.pagination.total.toLocaleString('es-VE')} principios activos
            </Typography>
            <Pagination
              count={data.pagination.totalPages}
              page={data.pagination.page}
              onChange={(_, value) => updateFilter('page', value)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Stack>
        </>
      )}

      <IngredientDetailDrawer
        ingredient={openIngredient}
        onClose={() => setOpenIngredient(null)}
      />
    </>
  );
}
