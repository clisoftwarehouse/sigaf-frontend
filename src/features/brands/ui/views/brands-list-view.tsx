import type { GridColDef } from '@mui/x-data-grid';
import type { Brand } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  useBrandsQuery,
  useDeleteBrandMutation,
  useRestoreBrandMutation,
} from '../../api/brands.queries';

// ----------------------------------------------------------------------

type ActiveFilter = 'active' | 'inactive';

export function BrandsListView() {
  const router = useRouter();
  const [filter, setFilter] = useState<ActiveFilter>('active');
  const [toDeactivate, setToDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [toRestore, setToRestore] = useState<{ id: string; name: string } | null>(null);

  const { data: brands = [], isLoading, isError, error, refetch } = useBrandsQuery({
    isActive: filter === 'active',
  });
  const deactivateMutation = useDeleteBrandMutation();
  const restoreMutation = useRestoreBrandMutation();

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(toDeactivate.id);
      toast.success(`Marca "${toDeactivate.name}" inactivada`);
      setToDeactivate(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmRestore = async () => {
    if (!toRestore) return;
    try {
      await restoreMutation.mutateAsync(toRestore.id);
      toast.success(`Marca "${toRestore.name}" reactivada`);
      setToRestore(null);
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
        renderCell: ({ row }) => <Typography variant="subtitle2">{row.name}</Typography>,
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
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          row.isActive ? (
            <>
              <Tooltip title="Editar">
                <IconButton onClick={() => router.push(paths.dashboard.catalog.brands.edit(row.id))}>
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Inactivar">
                <IconButton
                  color="warning"
                  onClick={() => setToDeactivate({ id: row.id, name: row.name })}
                >
                  <Iconify icon="solar:forbidden-circle-bold" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Reactivar">
              <IconButton
                color="success"
                onClick={() => setToRestore({ id: row.id, name: row.name })}
              >
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <ToggleButtonGroup
            value={filter}
            exclusive
            size="small"
            onChange={(_, value: ActiveFilter | null) => value && setFilter(value)}
          >
            <ToggleButton value="active">Activas</ToggleButton>
            <ToggleButton value="inactive">Inactivas</ToggleButton>
          </ToggleButtonGroup>
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
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDeactivate}
        title="Inactivar marca"
        description={
          toDeactivate ? (
            <>
              ¿Seguro que deseas inactivar la marca <strong>{toDeactivate.name}</strong>? Podrás
              reactivarla luego desde la pestaña &quot;Inactivas&quot;.
            </>
          ) : null
        }
        confirmLabel="Inactivar"
        loading={deactivateMutation.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setToDeactivate(null)}
      />

      <ConfirmDialog
        open={!!toRestore}
        title="Reactivar marca"
        description={
          toRestore ? (
            <>
              ¿Reactivar la marca <strong>{toRestore.name}</strong>?
            </>
          ) : null
        }
        confirmLabel="Reactivar"
        loading={restoreMutation.isPending}
        onConfirm={confirmRestore}
        onClose={() => setToRestore(null)}
      />
    </Container>
  );
}
