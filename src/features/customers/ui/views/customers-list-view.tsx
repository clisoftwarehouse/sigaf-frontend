import type { GridColDef } from '@mui/x-data-grid';
import type { Customer } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  useCustomersQuery,
  useDeleteCustomerMutation,
  useRestoreCustomerMutation,
} from '../../api/customers.queries';

// ----------------------------------------------------------------------

type ActiveFilter = 'active' | 'inactive';

const TYPE_LABEL: Record<Customer['customerType'], string> = {
  retail: 'Mostrador',
  frecuente: 'Frecuente',
  corporativo: 'Corporativo',
};

const TYPE_COLOR: Record<Customer['customerType'], 'default' | 'info' | 'warning'> = {
  retail: 'default',
  frecuente: 'info',
  corporativo: 'warning',
};

export function CustomersListView() {
  const router = useRouter();
  const [filter, setFilter] = useState<ActiveFilter>('active');
  const [search, setSearch] = useState('');
  const [toDeactivate, setToDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [toRestore, setToRestore] = useState<{ id: string; name: string } | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomersQuery({
    isActive: filter === 'active',
    search: search.trim() || undefined,
    limit: 100,
  });
  const customers = data?.data ?? [];
  const deactivateMutation = useDeleteCustomerMutation();
  const restoreMutation = useRestoreCustomerMutation();

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(toDeactivate.id);
      toast.success(`Cliente "${toDeactivate.name}" inactivado`);
      setToDeactivate(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmRestore = async () => {
    if (!toRestore) return;
    try {
      await restoreMutation.mutateAsync(toRestore.id);
      toast.success(`Cliente "${toRestore.name}" reactivado`);
      setToRestore(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Customer>[]>(
    () => [
      {
        field: 'document',
        headerName: 'Documento',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.documentType}-{row.documentNumber}
          </Typography>
        ),
      },
      {
        field: 'fullName',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => <Typography variant="subtitle2">{row.fullName}</Typography>,
      },
      {
        field: 'customerType',
        headerName: 'Tipo',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip size="small" color={TYPE_COLOR[row.customerType]} label={TYPE_LABEL[row.customerType]} />
          </Box>
        ),
      },
      {
        field: 'phone',
        headerName: 'Teléfono',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => row.phone ?? '—',
      },
      {
        field: 'defaultDiscountPercent',
        headerName: 'Desc.',
        flex: 0.5,
        minWidth: 80,
        renderCell: ({ row }) => `${Number(row.defaultDiscountPercent).toFixed(2)}%`,
      },
      {
        field: 'createdAt',
        headerName: 'Creado',
        flex: 1,
        minWidth: 170,
        renderCell: ({ row }) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            {row.isActive ? (
              <>
                <Tooltip title="Editar">
                  <IconButton
                    onClick={() => router.push(paths.dashboard.pos.customers.edit(row.id))}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Inactivar">
                  <IconButton
                    color="warning"
                    onClick={() => setToDeactivate({ id: row.id, name: row.fullName })}
                  >
                    <Iconify icon="solar:forbidden-circle-bold" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Reactivar">
                <IconButton
                  color="success"
                  onClick={() => setToRestore({ id: row.id, name: row.fullName })}
                >
                  <Iconify icon="solar:restart-bold" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [router]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Clientes"
        subtitle="Clientes B2C/B2B de la farmacia."
        crumbs={[{ label: 'POS' }, { label: 'Clientes' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.pos.customers.new)}
          >
            Nuevo cliente
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            size="small"
            placeholder="Buscar por nombre, documento o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 320 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:user-rounded-bold" width={18} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <ToggleButtonGroup
            value={filter}
            exclusive
            size="small"
            onChange={(_, value: ActiveFilter | null) => value && setFilter(value)}
          >
            <ToggleButton value="active">Activos</ToggleButton>
            <ToggleButton value="inactive">Inactivos</ToggleButton>
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
              {(error as Error)?.message ?? 'Error al cargar clientes'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={customers}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDeactivate}
        title="Inactivar cliente"
        description={
          toDeactivate ? (
            <>
              ¿Inactivar a <strong>{toDeactivate.name}</strong>? Sus ventas históricas se conservan.
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
        title="Reactivar cliente"
        description={
          toRestore ? (
            <>
              ¿Reactivar a <strong>{toRestore.name}</strong>?
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
