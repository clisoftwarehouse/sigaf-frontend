import type { GridColDef } from '@mui/x-data-grid';
import type { Supplier } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import { useSuppliersQuery, useDeleteSupplierMutation } from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

export function SuppliersListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: suppliers = [], isLoading, isError, error, refetch } = useSuppliersQuery();
  const deleteMutation = useDeleteSupplierMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Proveedor "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Supplier>[]>(
    () => [
      {
        field: 'businessName',
        headerName: 'Razón social',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="subtitle2">{row.businessName}</Typography>
            {row.tradeName && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {row.tradeName}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'rif',
        headerName: 'RIF',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.rif}
          </Typography>
        ),
      },
      {
        field: 'isDrugstore',
        headerName: 'Tipo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: [
          { value: true, label: 'Droguería' },
          { value: false, label: 'Proveedor' },
        ],
        renderCell: ({ row }) =>
          row.isDrugstore ? (
            <Chip size="small" color="info" label="Droguería" />
          ) : (
            <Chip size="small" variant="outlined" label="Proveedor" />
          ),
      },
      {
        field: 'contact',
        headerName: 'Contacto',
        flex: 1,
        minWidth: 180,
        valueGetter: (_value, row) => row.phone ?? row.email ?? '—',
      },
      {
        field: 'paymentTermsDays',
        headerName: 'Crédito (días)',
        type: 'number',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: number | null) => value ?? null,
      },
      {
        field: 'isActive',
        headerName: 'Activo',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
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
                onClick={() => router.push(paths.dashboard.catalog.suppliers.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                color="error"
                onClick={() => setToDelete({ id: row.id, name: row.businessName })}
              >
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
        title="Proveedores"
        subtitle="Proveedores, droguerías y laboratorios."
        crumbs={[{ label: 'Catálogo' }, { label: 'Proveedores' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.suppliers.new)}
          >
            Nuevo proveedor
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
              {(error as Error)?.message ?? 'Error al cargar proveedores'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={suppliers}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: { isActive: false },
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
        title="Eliminar proveedor"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>? Si tiene movimientos
              asociados, la operación puede fallar.
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
