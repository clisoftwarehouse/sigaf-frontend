import type { GridColDef } from '@mui/x-data-grid';
import type { SigafUser } from '../../model/types';

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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useRoleOptions } from '@/features/roles/api/roles.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import {
  useUsersQuery,
  useDeleteUserMutation,
  useRestoreUserMutation,
} from '../../api/users.queries';

// ----------------------------------------------------------------------

type ActiveFilter = 'active' | 'inactive';

export function UsersListView() {
  const router = useRouter();
  const [filter, setFilter] = useState<ActiveFilter>('active');
  const [toDeactivate, setToDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [toRestore, setToRestore] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useUsersQuery({
    page: 1,
    limit: 1000,
    filters: { isActive: filter === 'active' },
  });
  const deactivateMutation = useDeleteUserMutation();
  const restoreMutation = useRestoreUserMutation();

  const users = data?.data ?? [];

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(toDeactivate.id);
      toast.success(`Usuario "${toDeactivate.name}" inactivado`);
      setToDeactivate(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmRestore = async () => {
    if (!toRestore) return;
    try {
      await restoreMutation.mutateAsync(toRestore.id);
      toast.success(`Usuario "${toRestore.name}" reactivado`);
      setToRestore(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const roleFilterOperators = useMemo(
    () =>
      createFkFilterOperators<SigafUser['role']>({
        useOptions: useRoleOptions,
        getIds: (role) => (role?.id ? [role.id] : []),
      }),
    []
  );

  const columns = useMemo<GridColDef<SigafUser>[]>(
    () => [
      {
        field: 'username',
        headerName: 'Usuario',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
            {row.username}
          </Typography>
        ),
      },
      {
        field: 'fullName',
        headerName: 'Nombre completo',
        flex: 2,
        minWidth: 200,
      },
      {
        field: 'role',
        headerName: 'Rol',
        flex: 1,
        minWidth: 160,
        filterOperators: roleFilterOperators,
        valueGetter: (_value, row) => row.role ?? null,
        valueFormatter: (value: SigafUser['role']) => value?.name ?? '—',
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
            {row.role?.name ?? '—'}
          </Typography>
        ),
        sortComparator: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? ''),
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 2,
        minWidth: 200,
        valueGetter: (value: string | null | undefined) => value ?? '—',
      },
      {
        field: 'phone',
        headerName: 'Teléfono',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null | undefined) => value ?? '—',
      },
      {
        field: 'isActive',
        headerName: 'Estado',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
        renderCell: ({ row }) =>
          row.isActive ? (
            <Chip size="small" color="success" label="Activo" />
          ) : (
            <Chip size="small" variant="outlined" label="Inactivo" />
          ),
      },
      {
        field: 'cedula',
        headerName: 'Cédula',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null | undefined) => value ?? '—',
      },
      {
        field: 'lastLoginAt',
        headerName: 'Último ingreso',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string | null | undefined) => (value ? new Date(value) : null),
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
                <IconButton onClick={() => router.push(paths.dashboard.admin.users.edit(row.id))}>
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Inactivar">
                <IconButton
                  color="warning"
                  onClick={() => setToDeactivate({ id: row.id, name: row.username })}
                >
                  <Iconify icon="solar:forbidden-circle-bold" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Reactivar">
              <IconButton
                color="success"
                onClick={() => setToRestore({ id: row.id, name: row.username })}
              >
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>
          ),
      },
    ],
    [router, roleFilterOperators]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles del sistema."
        crumbs={[{ label: 'Administración' }, { label: 'Usuarios' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.admin.users.new)}
          >
            Nuevo usuario
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
              {(error as Error)?.message ?? 'Error al cargar usuarios'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={users}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: {
                  cedula: false,
                  lastLoginAt: false,
                  phone: false,
                  isActive: false,
                },
              },
            }}
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDeactivate}
        title="Inactivar usuario"
        description={
          toDeactivate ? (
            <>
              ¿Inactivar al usuario <strong>{toDeactivate.name}</strong>? No podrá iniciar sesión
              hasta ser reactivado desde la pestaña &quot;Inactivos&quot;.
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
        title="Reactivar usuario"
        description={
          toRestore ? (
            <>
              ¿Reactivar al usuario <strong>{toRestore.name}</strong>?
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
