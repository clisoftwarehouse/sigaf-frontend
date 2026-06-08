import type { GridColDef } from '@mui/x-data-grid';
import type { Warehouse } from '../../model/types';

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
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useWarehousesQuery, useDeleteWarehouseMutation } from '../../api/warehouses.queries';

// ----------------------------------------------------------------------

export function WarehousesListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: warehouses = [], isLoading, isError, error, refetch } = useWarehousesQuery();
  const deleteMutation = useDeleteWarehouseMutation();

  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Almacén "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );

  const columns = useMemo<GridColDef<Warehouse>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 1.2,
        minWidth: 160,
        valueGetter: (_value, row) => row.name ?? row.locationCode,
      },
      {
        field: 'locationCode',
        headerName: 'Código',
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.locationCode}
          </Typography>
        ),
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        filterOperators: branchFilterOperators,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (branchNameById.get(a) ?? '').localeCompare(branchNameById.get(b) ?? ''),
      },
      {
        field: 'flags',
        headerName: 'Uso',
        flex: 1.5,
        minWidth: 240,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {row.isQuarantine && <Chip size="small" color="warning" label="Cuarentena" />}
            {row.isForSale && <Chip size="small" color="success" variant="outlined" label="Venta" />}
            {row.isForPurchase && (
              <Chip size="small" color="info" variant="outlined" label="Compra" />
            )}
            {!row.isQuarantine && !row.isForSale && !row.isForPurchase && (
              <Chip size="small" variant="outlined" label="Sin uso" />
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
                onClick={() => router.push(paths.dashboard.organization.warehouses.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                color="error"
                onClick={() =>
                  setToDelete({ id: row.id, name: row.name ?? row.locationCode })
                }
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [router, branchFilterOperators, branchNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Almacenes"
        subtitle="Almacenes por sucursal con marcas para venta, compra y cuarentena."
        crumbs={[{ label: 'Organización' }, { label: 'Almacenes' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.organization.warehouses.new)}
          >
            Nuevo almacén
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
              {(error as Error)?.message ?? 'Error al cargar almacenes'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={warehouses}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar almacén"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar el almacén <strong>{toDelete.name}</strong>?
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
