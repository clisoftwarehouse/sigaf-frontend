import type { GridColDef } from '@mui/x-data-grid';
import type { SigafUser } from '../../model/types';

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
import { useRoleOptions } from '@/features/roles/api/roles.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useUsersQuery, useDeleteUserMutation } from '../../api/users.queries';

// ----------------------------------------------------------------------

export function UsersListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsersQuery({ page: 1, limit: 1000 });
  const deleteMutation = useDeleteUserMutation();

  const users = data?.data ?? [];

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Usuario "${toDelete.name}" eliminado`);
      setToDelete(null);
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
        headerName: 'Activo',
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
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <>
            <Tooltip title="Editar">
              <IconButton onClick={() => router.push(paths.dashboard.admin.users.edit(row.id))}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                color="error"
                onClick={() => setToDelete({ id: row.id, name: row.username })}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
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
                columnVisibilityModel: { cedula: false, lastLoginAt: false, phone: false },
              },
            }}
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar al usuario <strong>{toDelete.name}</strong>? Esta acción
              es reversible solo desde el backend.
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
