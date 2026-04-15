import type { GridColDef } from '@mui/x-data-grid';
import type { Branch } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import { useBranchesQuery, useDeleteBranchMutation } from '../../api/branches.queries';

// ----------------------------------------------------------------------

export function BranchesListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: branches = [], isLoading, isError, error, refetch } = useBranchesQuery();
  const deleteMutation = useDeleteBranchMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Sucursal "${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Branch>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 180,
        renderCell: ({ row }) => <Typography variant="subtitle2">{row.name}</Typography>,
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
        field: 'address',
        headerName: 'Dirección',
        flex: 3,
        minWidth: 240,
      },
      {
        field: 'contact',
        headerName: 'Contacto',
        flex: 1,
        minWidth: 180,
        valueGetter: (_value, row) => row.phone ?? row.email ?? '—',
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
                onClick={() => router.push(paths.dashboard.organization.branches.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                color="error"
                onClick={() => setToDelete({ id: row.id, name: row.name })}
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
        title="Sucursales"
        subtitle="Red de farmacias y puntos de venta físicos."
        crumbs={[{ label: 'Organización' }, { label: 'Sucursales' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.organization.branches.new)}
          >
            Nueva sucursal
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
              {(error as Error)?.message ?? 'Error al cargar sucursales'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={branches}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar sucursal"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>? Perderás los terminales
              y ubicaciones asociados.
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
