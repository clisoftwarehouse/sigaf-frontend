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

import { useSuppliersQuery, useDeleteSupplierMutation } from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

type DrugstoreFilter = 'all' | 'drugstore' | 'regular';
type ActiveFilter = 'all' | 'active' | 'inactive';

export function SuppliersListView() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [drugstore, setDrugstore] = useState<DrugstoreFilter>('all');
  const [active, setActive] = useState<ActiveFilter>('active');
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      isDrugstore:
        drugstore === 'drugstore' ? true : drugstore === 'regular' ? false : undefined,
      isActive: active === 'active' ? true : active === 'inactive' ? false : undefined,
    }),
    [search, drugstore, active]
  );

  const {
    data: suppliers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSuppliersQuery(filters);
  const deleteMutation = useDeleteSupplierMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Proveedor "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Proveedores"
        subtitle="Proveedores, droguerías y laboratorios."
        crumbs={[{ label: 'Catálogo' }, { label: 'Proveedores' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.suppliers.new)}
          >
            Nuevo proveedor
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
            placeholder="Buscar por RIF, razón social…"
          />
          <TextField
            select
            value={drugstore}
            onChange={(e) => setDrugstore(e.target.value as DrugstoreFilter)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Todos los tipos</MenuItem>
            <MenuItem value="drugstore">Droguerías B2B</MenuItem>
            <MenuItem value="regular">Proveedores regulares</MenuItem>
          </TextField>
          <TextField
            select
            value={active}
            onChange={(e) => setActive(e.target.value as ActiveFilter)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="inactive">Inactivos</MenuItem>
            <MenuItem value="all">Todos</MenuItem>
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
              {(error as Error)?.message ?? 'Error al cargar proveedores'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Razón social</TableCell>
                <TableCell>RIF</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Crédito</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={6} />}

              {!isLoading && suppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin proveedores"
                      description="No hay proveedores que coincidan con los filtros."
                    />
                  </TableCell>
                </TableRow>
              )}

              {suppliers.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{s.businessName}</Typography>
                    {s.tradeName && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {s.tradeName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{s.rif}</TableCell>
                  <TableCell>
                    {s.isDrugstore ? (
                      <Chip size="small" color="info" label="Droguería" />
                    ) : (
                      <Chip size="small" variant="outlined" label="Proveedor" />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {s.phone ?? s.email ?? '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {s.paymentTermsDays != null ? `${s.paymentTermsDays} días` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => router.push(paths.dashboard.catalog.suppliers.edit(s.id))}
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setToDelete({ id: s.id, name: s.businessName })}
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
        title="Eliminar proveedor"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>? Si tiene movimientos
              asociados, la operación puede fallar.
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
