import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import { useTerminalsQuery, useDeleteTerminalMutation } from '../../api/terminals.queries';

// ----------------------------------------------------------------------

export function TerminalsListView() {
  const router = useRouter();
  const [branchId, setBranchId] = useState<string>('');
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: branches = [] } = useBranchesQuery();
  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );

  const filters = useMemo(() => ({ branchId: branchId || undefined }), [branchId]);

  const { data: terminals = [], isLoading, isError, error, refetch } = useTerminalsQuery(filters);
  const deleteMutation = useDeleteTerminalMutation();

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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            label="Filtrar por sucursal"
            sx={{ minWidth: 260 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todas las sucursales</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
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
              {(error as Error)?.message ?? 'Error al cargar terminales'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Hardware</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={5} columns={5} />}

              {!isLoading && terminals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState icon="inbox" title="Sin terminales" description="No hay terminales POS registrados." />
                  </TableCell>
                </TableRow>
              )}

              {terminals.map((t) => {
                const hardware = [
                  t.fiscalPrinterConfig && 'impresora',
                  t.scaleConfig && 'báscula',
                  t.cashDrawerConfig && 'gaveta',
                ].filter(Boolean) as string[];

                return (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.code}</TableCell>
                    <TableCell>{t.name ?? '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {branchById.get(t.branchId) ?? t.branchId}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {hardware.length > 0 ? hardware.join(', ') : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() =>
                          router.push(paths.dashboard.organization.terminals.edit(t.id))
                        }
                      >
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => setToDelete({ id: t.id, name: t.code })}
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
