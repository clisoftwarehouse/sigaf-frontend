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
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';

import { useReceiptsQuery } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

export function ReceiptsListView() {
  const router = useRouter();
  const [branchId, setBranchId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  const { data: branches = [] } = useBranchesQuery();
  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const supplierById = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.businessName] as const)),
    [suppliers]
  );

  const filters = useMemo(
    () => ({
      branchId: branchId || undefined,
      supplierId: supplierId || undefined,
    }),
    [branchId, supplierId]
  );

  const { data: receipts = [], isLoading, isError, error, refetch } = useReceiptsQuery(filters);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Recepciones de mercancía"
        subtitle="Cada recepción crea lotes automáticamente e inserta movimientos en el kardex."
        crumbs={[{ label: 'Compras' }, { label: 'Recepciones' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.purchases.receipts.new)}
          >
            Nueva recepción
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, flexWrap: 'wrap' }}
        >
          <TextField
            select
            label="Sucursal"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            sx={{ minWidth: 220 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todas</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Proveedor"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.businessName}
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
              {(error as Error)?.message ?? 'Error al cargar'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Factura</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={5} columns={6} />}

              {!isLoading && receipts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin recepciones"
                      description="Registra una recepción para empezar a recibir mercancía."
                    />
                  </TableCell>
                </TableRow>
              )}

              {receipts.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(r.createdAt).toLocaleDateString('es-VE')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {supplierById.get(r.supplierId) ?? r.supplierId}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {branchById.get(r.branchId) ?? r.branchId}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {r.supplierInvoiceNumber ?? '—'}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{r.receiptType}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() =>
                        router.push(paths.dashboard.purchases.receipts.detail(r.id))
                      }
                    >
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
