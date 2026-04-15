import type { GridColDef } from '@mui/x-data-grid';
import type { Product } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useBrandOptions } from '@/features/brands/api/brands.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';
import { useCategoryOptions } from '@/features/categories/api/categories.options';

import { useProductsQuery, useDeleteProductMutation } from '../../api/products.queries';
import {
  TAX_TYPE_OPTIONS,
  PRODUCT_TYPE_LABEL,
  PRODUCT_TYPE_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

export function ProductsListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useProductsQuery({
    page: 1,
    limit: 1000,
  });
  const deleteMutation = useDeleteProductMutation();

  const { data: categoryOpts = [] } = useCategoryOptions();
  const { data: brandOpts = [] } = useBrandOptions();

  const categoryNameById = useMemo(
    () => new Map(categoryOpts.map((o) => [o.id, o.label] as const)),
    [categoryOpts]
  );
  const brandNameById = useMemo(
    () => new Map(brandOpts.map((o) => [o.id, o.label] as const)),
    [brandOpts]
  );

  const products = data?.data ?? [];

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

  const categoryFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useCategoryOptions }),
    []
  );
  const brandFilterOperators = useMemo(
    () => createFkFilterOperators<string | null>({
      useOptions: useBrandOptions,
      getIds: (v) => (v ? [v] : []),
    }),
    []
  );

  const columns = useMemo<GridColDef<Product>[]>(
    () => [
      {
        field: 'description',
        headerName: 'Producto',
        flex: 2.5,
        minWidth: 240,
        renderCell: ({ row }) => (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2">{row.shortName ?? row.description}</Typography>
              {!row.isActive && <Chip size="small" variant="outlined" label="Inactivo" />}
            </Stack>
            {row.shortName && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {row.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'code',
        headerName: 'Código',
        flex: 1,
        minWidth: 160,
        valueGetter: (_v, row) =>
          row.barcodes?.find((b) => b.isPrimary)?.barcode ??
          row.barcodes?.[0]?.barcode ??
          row.internalCode ??
          '—',
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'categoryId',
        headerName: 'Categoría',
        flex: 1.5,
        minWidth: 180,
        filterOperators: categoryFilterOperators,
        valueFormatter: (value: string) => categoryNameById.get(value) ?? '—',
        sortComparator: (a, b) =>
          (categoryNameById.get(a) ?? '').localeCompare(categoryNameById.get(b) ?? ''),
      },
      {
        field: 'brandId',
        headerName: 'Marca',
        flex: 1.5,
        minWidth: 160,
        filterOperators: brandFilterOperators,
        valueFormatter: (value: string | null) => (value ? brandNameById.get(value) ?? '—' : '—'),
        sortComparator: (a, b) =>
          (brandNameById.get(a ?? '') ?? '').localeCompare(brandNameById.get(b ?? '') ?? ''),
      },
      {
        field: 'productType',
        headerName: 'Tipo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 160,
        valueOptions: PRODUCT_TYPE_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            variant="outlined"
            label={PRODUCT_TYPE_LABEL[row.productType] ?? row.productType}
          />
        ),
      },
      {
        field: 'taxType',
        headerName: 'IVA',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: TAX_TYPE_OPTIONS,
      },
      {
        field: 'isControlled',
        headerName: 'Controlado',
        type: 'boolean',
        flex: 1,
        minWidth: 130,
      },
      {
        field: 'requiresRecipe',
        headerName: 'Récipe',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'isAntibiotic',
        headerName: 'Antibiótico',
        type: 'boolean',
        flex: 1,
        minWidth: 130,
      },
      {
        field: 'isWeighable',
        headerName: 'Pesable',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'stockMin',
        headerName: 'Stock mín.',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) =>
          value == null ? null : Number(value),
      },
      {
        field: 'isActive',
        headerName: 'Activo',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'flags',
        headerName: 'Flags',
        sortable: false,
        filterable: false,
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ height: '100%' }}>
            {row.isControlled && (
              <Tooltip title="Sustancia controlada">
                <Iconify
                  icon="solar:shield-keyhole-bold-duotone"
                  width={16}
                  sx={{ color: 'error.main' }}
                />
              </Tooltip>
            )}
            {row.requiresRecipe && (
              <Tooltip title="Requiere récipe">
                <Iconify icon="solar:bill-list-bold" width={16} sx={{ color: 'warning.main' }} />
              </Tooltip>
            )}
            {row.isAntibiotic && (
              <Tooltip title="Antibiótico">
                <Iconify icon="solar:atom-bold-duotone" width={16} sx={{ color: 'info.main' }} />
              </Tooltip>
            )}
            {row.isWeighable && (
              <Tooltip title="Pesable">
                <Iconify icon="solar:archive-down-minimlistic-bold" width={16} />
              </Tooltip>
            )}
          </Stack>
        ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <>
            <Tooltip title="Editar">
              <IconButton
                onClick={() => router.push(paths.dashboard.catalog.products.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Desactivar">
              <IconButton
                color="error"
                onClick={() =>
                  setToDelete({ id: row.id, name: row.shortName ?? row.description })
                }
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [router, categoryFilterOperators, brandFilterOperators, categoryNameById, brandNameById]
  );

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

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={products}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: {
                  taxType: false,
                  isControlled: false,
                  requiresRecipe: false,
                  isAntibiotic: false,
                  isWeighable: false,
                  stockMin: false,
                },
              },
              filter: {
                filterModel: {
                  items: [{ field: 'isActive', operator: 'is', value: 'true' }],
                  quickFilterValues: [''],
                },
              },
            }}
          />
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
