import type { GridColDef } from '@mui/x-data-grid';
import type { Terminal } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import {
  useTerminalsQuery,
  useDeleteTerminalMutation,
  useRestoreTerminalMutation,
} from '../../api/terminals.queries';

// ----------------------------------------------------------------------

export function TerminalsListView() {
  const router = useRouter();
  const { selectedBranchId } = useBranchScope();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  // Cuando está activo, la lista muestra los terminales DESACTIVADOS (para
  // reactivarlos). Por defecto muestra los activos.
  const [viewInactive, setViewInactive] = useState(false);

  const {
    data: terminals = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTerminalsQuery({ isActive: !viewInactive, branchId: selectedBranchId ?? undefined });
  const deleteMutation = useDeleteTerminalMutation();
  const restoreMutation = useRestoreTerminalMutation();

  const handleRestore = async (row: { id: string; code: string }) => {
    try {
      await restoreMutation.mutateAsync(row.id);
      toast.success(`Terminal "${row.code}" reactivado`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Terminal "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );

  const columns = useMemo<GridColDef<Terminal>[]>(
    () => [
      {
        field: 'code',
        headerName: 'Código',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.code}
          </Typography>
        ),
      },
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 180,
        valueGetter: (value: string | null | undefined) => value ?? '—',
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
        field: 'isActive',
        headerName: 'Activo',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'lastSyncAt',
        headerName: 'Última sync',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string | null) => (value ? new Date(value) : null),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          row.isActive ? (
            <>
              <Tooltip title="Editar">
                <IconButton
                  onClick={() => router.push(paths.dashboard.organization.terminals.edit(row.id))}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton
                  color="error"
                  onClick={() => setToDelete({ id: row.id, name: row.code })}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Reactivar">
              <IconButton color="success" onClick={() => handleRestore(row)}>
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, branchFilterOperators, branchNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Terminales POS"
        subtitle="Cajas registradoras y hardware fiscal por sucursal."
        crumbs={[{ label: 'Organización' }, { label: 'Terminales' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.organization.terminals.new)}
          >
            Nuevo terminal
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
              {(error as Error)?.message ?? 'Error al cargar terminales'}
            </Alert>
          </Box>
        )}

        <Stack direction="row" justifyContent="flex-end" sx={{ px: 2, pt: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewInactive}
                onChange={(e) => setViewInactive(e.target.checked)}
              />
            }
            label="Mostrar desactivados"
          />
        </Stack>

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={terminals}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: { isActive: false, lastSyncAt: false },
              },
            }}
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar terminal"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar el terminal <strong>{toDelete.name}</strong>?
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
