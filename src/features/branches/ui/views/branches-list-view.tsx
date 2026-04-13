import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>RIF</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={4} columns={5} />}

              {!isLoading && branches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState icon="inbox" title="Sin sucursales" description="Aún no has registrado sucursales." />
                  </TableCell>
                </TableRow>
              )}

              {branches.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{b.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{b.rif}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 260 }}>
                    <Typography variant="body2" noWrap>
                      {b.address}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {b.phone ?? b.email ?? '—'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => router.push(paths.dashboard.organization.branches.edit(b.id))}
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setToDelete({ id: b.id, name: b.name })}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
