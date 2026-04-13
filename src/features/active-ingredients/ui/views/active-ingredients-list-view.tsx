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

import {
  useActiveIngredientsQuery,
  useDeleteActiveIngredientMutation,
} from '../../api/active-ingredients.queries';

// ----------------------------------------------------------------------

export function ActiveIngredientsListView() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useActiveIngredientsQuery({ search: search.trim() || undefined });
  const deleteMutation = useDeleteActiveIngredientMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Principio activo "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Principios activos"
        subtitle="Usados para sustitución de medicamentos genéricos."
        crumbs={[{ label: 'Catálogo' }, { label: 'Principios activos' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.activeIngredients.new)}
          >
            Nuevo principio activo
          </Button>
        }
      />

      <Card>
        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o grupo…"
          />
        </Box>

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
              {(error as Error)?.message ?? 'Error al cargar'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Grupo terapéutico</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={3} />}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin principios activos"
                      description="No hay principios activos registrados."
                    />
                  </TableCell>
                </TableRow>
              )}

              {items.map((it) => (
                <TableRow key={it.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{it.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {it.therapeuticGroup ?? '—'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() =>
                        router.push(paths.dashboard.catalog.activeIngredients.edit(it.id))
                      }
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setToDelete({ id: it.id, name: it.name })}
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
        title="Eliminar principio activo"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>?
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
