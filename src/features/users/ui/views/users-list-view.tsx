import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useRolesQuery } from '@/features/roles/api/roles.queries';

import { useUsersQuery, useDeleteUserMutation } from '../../api/users.queries';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

export function UsersListView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [roleId, setRoleId] = useState<string>('');
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: roles = [] } = useRolesQuery();

  const args = useMemo(
    () => ({ page, limit: PAGE_SIZE, filters: roleId ? { roleId } : undefined }),
    [page, roleId]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useUsersQuery(args);
  const deleteMutation = useDeleteUserMutation();

  const users = data?.data ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

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
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            select
            label="Filtrar por rol"
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 240 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos los roles</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id} sx={{ textTransform: 'capitalize' }}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Nombre completo</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={6} />}

              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState icon="inbox" title="Sin usuarios" description="No hay usuarios que coincidan con los filtros." />
                  </TableCell>
                </TableRow>
              )}

              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                      {u.username}
                    </Typography>
                  </TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                    {u.role?.name ?? '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {u.email ?? u.phone ?? '—'}
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Chip size="small" color="success" label="Activo" />
                    ) : (
                      <Chip size="small" variant="outlined" label="Inactivo" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => router.push(paths.dashboard.admin.users.edit(u.id))}
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setToDelete({ id: u.id, name: u.username })}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Página {page}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!hasNextPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Stack>
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
