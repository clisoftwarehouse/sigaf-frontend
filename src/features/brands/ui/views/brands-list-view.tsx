import type { GridColDef } from '@mui/x-data-grid';
import type { Brand } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import { BRAND_TYPE_LABEL, BRAND_TYPE_OPTIONS } from '../../model/types';
import { useBrandsQuery, useDeleteBrandMutation } from '../../api/brands.queries';

// ----------------------------------------------------------------------

export function BrandsListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: brands = [], isLoading, isError, error, refetch } = useBrandsQuery();
  const deleteMutation = useDeleteBrandMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Marca "${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Brand>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="subtitle2">{row.name}</Typography>
            {row.businessName && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {row.businessName}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'brandType',
        headerName: 'Categoría',
        type: 'singleSelect',
        flex: 1,
        minWidth: 160,
        valueOptions: BRAND_TYPE_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            variant="outlined"
            label={BRAND_TYPE_LABEL[row.brandType] ?? row.brandType}
          />
        ),
      },
      {
        field: 'isLaboratory',
        headerName: 'Laboratorio',
        type: 'boolean',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) =>
          row.isLaboratory ? (
            <Chip size="small" color="info" label="Laboratorio" />
          ) : (
            <Chip size="small" variant="outlined" label="Marca" />
          ),
      },
      {
        field: 'rif',
        headerName: 'RIF',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'countryOfOrigin',
        headerName: 'País',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'isImporter',
        headerName: 'Importador',
        type: 'boolean',
        flex: 1,
        minWidth: 130,
      },
      {
        field: 'isManufacturer',
        headerName: 'Fabricante',
        type: 'boolean',
        flex: 1,
        minWidth: 130,
      },
      {
        field: 'isActive',
        headerName: 'Activo',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'createdAt',
        headerName: 'Creada',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string) => (value ? new Date(value) : null),
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
              <IconButton onClick={() => router.push(paths.dashboard.catalog.brands.edit(row.id))}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton color="error" onClick={() => setToDelete({ id: row.id, name: row.name })}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [router]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Marcas"
        subtitle="Catálogo de marcas y laboratorios farmacéuticos."
        crumbs={[{ label: 'Catálogo' }, { label: 'Marcas' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.brands.new)}
          >
            Nueva marca
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
              {(error as Error)?.message ?? 'Error al cargar marcas'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={brands}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: {
                  countryOfOrigin: false,
                  isImporter: false,
                  isManufacturer: false,
                  createdAt: false,
                  isActive: false,
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
        title="Eliminar marca"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar la marca <strong>{toDelete.name}</strong>? Esta acción no
              se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
