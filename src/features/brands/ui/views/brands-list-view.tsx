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

import { useBrandsQuery, useDeleteBrandMutation } from '../../api/brands.queries';

// ----------------------------------------------------------------------

type LabFilter = 'all' | 'lab' | 'no-lab';

export function BrandsListView() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [labFilter, setLabFilter] = useState<LabFilter>('all');
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      isLaboratory: labFilter === 'lab' ? true : labFilter === 'no-lab' ? false : undefined,
    }),
    [search, labFilter]
  );

  const { data: brands = [], isLoading, isError, error, refetch } = useBrandsQuery(filters);
  const deleteMutation = useDeleteBrandMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Marca "${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

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
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
          />

          <TextField
            select
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value as LabFilter)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="lab">Solo laboratorios</MenuItem>
            <MenuItem value="no-lab">Sin laboratorios</MenuItem>
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
              {(error as Error)?.message ?? 'Error al cargar marcas'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={3} />}

              {!isLoading && brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin marcas"
                      description="No hay marcas registradas que coincidan con los filtros."
                    />
                  </TableCell>
                </TableRow>
              )}

              {brands.map((brand) => (
                <TableRow key={brand.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{brand.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {brand.isLaboratory ? (
                      <Chip size="small" color="info" label="Laboratorio" />
                    ) : (
                      <Chip size="small" variant="outlined" label="Marca" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => router.push(paths.dashboard.catalog.brands.edit(brand.id))}
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setToDelete({ id: brand.id, name: brand.name })}
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
        title="Eliminar marca"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar la marca <strong>{toDelete.name}</strong>? Esta acción no
              se puede deshacer.
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
