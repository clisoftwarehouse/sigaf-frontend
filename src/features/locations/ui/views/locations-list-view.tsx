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
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

import { useLocationsQuery, useDeleteLocationMutation } from '../../api/locations.queries';

// ----------------------------------------------------------------------

type QuarantineFilter = 'all' | 'quarantine' | 'normal';

export function LocationsListView() {
  const router = useRouter();
  const [branchId, setBranchId] = useState<string>('');
  const [quarantine, setQuarantine] = useState<QuarantineFilter>('all');
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: branches = [] } = useBranchesQuery();
  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );

  const filters = useMemo(
    () => ({
      branchId: branchId || undefined,
      isQuarantine:
        quarantine === 'quarantine' ? true : quarantine === 'normal' ? false : undefined,
    }),
    [branchId, quarantine]
  );

  const { data: locations = [], isLoading, isError, error, refetch } = useLocationsQuery(filters);
  const deleteMutation = useDeleteLocationMutation();

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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            label="Sucursal"
            sx={{ minWidth: 220 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todas las sucursales</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            value={quarantine}
            onChange={(e) => setQuarantine(e.target.value as QuarantineFilter)}
            label="Zona"
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="normal">Venta normal</MenuItem>
            <MenuItem value="quarantine">Cuarentena</MenuItem>
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
              {(error as Error)?.message ?? 'Error al cargar ubicaciones'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Pasillo / Estante / Sección</TableCell>
                <TableCell>Capacidad</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={5} columns={6} />}

              {!isLoading && locations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState icon="inbox" title="Sin ubicaciones" description="No hay ubicaciones registradas." />
                  </TableCell>
                </TableRow>
              )}

              {locations.map((l) => {
                const parts = [l.aisle, l.shelf, l.section].filter(Boolean).join(' / ');
                return (
                  <TableRow key={l.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{l.locationCode}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {branchById.get(l.branchId) ?? l.branchId}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{parts || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {l.capacity != null ? l.capacity : '—'}
                    </TableCell>
                    <TableCell>
                      {l.isQuarantine ? (
                        <Chip size="small" color="warning" label="Cuarentena" />
                      ) : (
                        <Chip size="small" variant="outlined" label="Normal" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() =>
                          router.push(paths.dashboard.organization.locations.edit(l.id))
                        }
                      >
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => setToDelete({ id: l.id, name: l.locationCode })}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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
