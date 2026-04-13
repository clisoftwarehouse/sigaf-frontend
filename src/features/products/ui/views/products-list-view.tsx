import type { TaxType, ProductType, StockStatus } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useBrandsQuery } from '@/features/brands/api/brands.queries';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';

import { useProductsQuery, useDeleteProductMutation } from '../../api/products.queries';
import {
  TAX_TYPE_OPTIONS,
  PRODUCT_TYPE_LABEL,
  STOCK_STATUS_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

type ActiveFilter = 'active' | 'inactive' | 'all';

export function ProductsListView() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [productType, setProductType] = useState<ProductType | ''>('');
  const [taxType, setTaxType] = useState<TaxType | ''>('');
  const [stockStatus, setStockStatus] = useState<StockStatus | ''>('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { flat: categories } = useCategoriesQuery();
  const { data: brands = [] } = useBrandsQuery();

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name] as const)),
    [categories]
  );
  const brandById = useMemo(
    () => new Map(brands.map((b) => [b.id, b.name] as const)),
    [brands]
  );

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      productType: (productType || undefined) as ProductType | undefined,
      taxType: (taxType || undefined) as TaxType | undefined,
      stockStatus: (stockStatus || undefined) as StockStatus | undefined,
      isActive:
        activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [search, categoryId, brandId, productType, taxType, stockStatus, activeFilter, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useProductsQuery(filters);
  const deleteMutation = useDeleteProductMutation();

  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Producto "${toDelete.name}" desactivado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const resetPage = () => setPage(1);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Productos"
        subtitle="Catálogo completo. Al eliminar se desactivan (soft delete)."
        crumbs={[{ label: 'Catálogo' }, { label: 'Productos' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.products.new)}
          >
            Nuevo producto
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, flexWrap: 'wrap' }}
        >
          <TextField
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Buscar por descripción, EAN o código…"
            sx={{ flex: 1, minWidth: 240 }}
          />

          <TextField
            select
            label="Categoría"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 200 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Marca"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todas</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Tipo"
            value={productType}
            onChange={(e) => {
              setProductType(e.target.value as ProductType | '');
              resetPage();
            }}
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {PRODUCT_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="IVA"
            value={taxType}
            onChange={(e) => {
              setTaxType(e.target.value as TaxType | '');
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {TAX_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Stock"
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value as StockStatus | '');
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {STOCK_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Estado"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as ActiveFilter);
              resetPage();
            }}
            sx={{ minWidth: 140 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="inactive">Inactivos</MenuItem>
            <MenuItem value="all">Todos</MenuItem>
          </TextField>
        </Stack>

        {isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar productos'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Categoría / Marca</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell align="right">Stock mín.</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={7} />}

              {!isLoading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="box"
                      title="Sin productos"
                      description="No hay productos que coincidan con los filtros."
                    />
                  </TableCell>
                </TableRow>
              )}

              {products.map((p) => {
                const flags: React.ReactNode[] = [];
                if (p.isControlled)
                  flags.push(
                    <Tooltip key="c" title="Sustancia controlada">
                      <Iconify icon="solar:shield-keyhole-bold-duotone" width={16} sx={{ color: 'error.main' }} />
                    </Tooltip>
                  );
                if (p.requiresRecipe)
                  flags.push(
                    <Tooltip key="r" title="Requiere récipe">
                      <Iconify icon="solar:bill-list-bold" width={16} sx={{ color: 'warning.main' }} />
                    </Tooltip>
                  );
                if (p.isAntibiotic)
                  flags.push(
                    <Tooltip key="a" title="Antibiótico">
                      <Iconify icon="solar:atom-bold-duotone" width={16} sx={{ color: 'info.main' }} />
                    </Tooltip>
                  );
                if (p.isWeighable)
                  flags.push(
                    <Tooltip key="w" title="Pesable">
                      <Iconify icon="solar:archive-down-minimlistic-bold" width={16} />
                    </Tooltip>
                  );

                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {p.shortName ?? p.description}
                        </Typography>
                        {!p.isActive && (
                          <Chip size="small" variant="outlined" label="Inactivo" />
                        )}
                      </Stack>
                      {p.shortName && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {p.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {p.barcodes?.find((b) => b.isPrimary)?.barcode ??
                        p.barcodes?.[0]?.barcode ??
                        p.internalCode ??
                        '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      <Typography variant="body2">
                        {categoryById.get(p.categoryId) ?? '—'}
                      </Typography>
                      {p.brandId && (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {brandById.get(p.brandId) ?? ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={PRODUCT_TYPE_LABEL[p.productType] ?? p.productType}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75}>
                        {flags.length > 0 ? flags : <Typography variant="caption">—</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {typeof p.stockMin === 'string' ? p.stockMin : p.stockMin.toString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => router.push(paths.dashboard.catalog.products.edit(p.id))}
                      >
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() =>
                          setToDelete({ id: p.id, name: p.shortName ?? p.description })
                        }
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {total > 0 ? `${total} productos · página ${page} de ${totalPages}` : ''}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Stack>
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Desactivar producto"
        description={
          toDelete ? (
            <>
              El producto <strong>{toDelete.name}</strong> se marcará como inactivo. Podrás
              reactivarlo editándolo y cambiando el filtro de estado.
            </>
          ) : null
        }
        confirmLabel="Desactivar"
        confirmColor="warning"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
