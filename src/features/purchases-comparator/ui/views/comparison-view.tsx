import type { ComparisonFilters } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';

import { ComparisonCard } from '../components/comparison-card';
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
        <Grid container spacing={2}>
          {Array.from({ length: filters.limit ?? 24 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      )}

      {data && data.data.length === 0 && (
        <Alert severity="info">
          No se encontraron principios activos con esos filtros. Probá ajustar la búsqueda.
        </Alert>
      )}

      {data && data.data.length > 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3, opacity: isFetching ? 0.6 : 1 }}>
            {data.data.map((group) => (
              <Grid key={group.activeIngredient} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ComparisonCard
                  group={group}
                  onOpenDetail={(name) => setOpenIngredient(name)}
                />
              </Grid>
            ))}
          </Grid>

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
