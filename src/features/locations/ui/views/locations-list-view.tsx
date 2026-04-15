import type { GridColDef } from '@mui/x-data-grid';
import type { WarehouseLocation } from '../../model/types';

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
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useLocationsQuery, useDeleteLocationMutation } from '../../api/locations.queries';

// ----------------------------------------------------------------------

export function LocationsListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: locations = [], isLoading, isError, error, refetch } = useLocationsQuery();
  const deleteMutation = useDeleteLocationMutation();

  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Ubicación "${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );

  const columns = useMemo<GridColDef<WarehouseLocation>[]>(
    () => [
      {
        field: 'locationCode',
        headerName: 'Código',
        flex: 1,
        minWidth: 140,
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
        field: 'aisle',
        headerName: 'Pasillo',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'shelf',
        headerName: 'Estante',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'section',
        headerName: 'Sección',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'capacity',
        headerName: 'Capacidad',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | null) => value ?? null,
      },
      {
        field: 'isQuarantine',
        headerName: 'Zona',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: [
          { value: true, label: 'Cuarentena' },
          { value: false, label: 'Normal' },
        ],
        renderCell: ({ row }) =>
          row.isQuarantine ? (
            <Chip size="small" color="warning" label="Cuarentena" />
          ) : (
            <Chip size="small" variant="outlined" label="Normal" />
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
                onClick={() => router.push(paths.dashboard.organization.locations.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                color="error"
                onClick={() => setToDelete({ id: row.id, name: row.locationCode })}
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
        title="Ubicaciones de almacén"
        subtitle="Pasillos, estantes y zonas de cuarentena por sucursal."
        crumbs={[{ label: 'Organización' }, { label: 'Ubicaciones' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.organization.locations.new)}
          >
            Nueva ubicación
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
              {(error as Error)?.message ?? 'Error al cargar ubicaciones'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={locations}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar ubicación"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar la ubicación <strong>{toDelete.name}</strong>?
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
