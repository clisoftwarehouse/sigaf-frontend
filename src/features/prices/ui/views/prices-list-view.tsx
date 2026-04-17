import type { GridColDef } from '@mui/x-data-grid';
import type { Price } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';

import { PriceFormDialog } from '../components/price-form-dialog';
import { usePricesQuery, useExpirePriceMutation } from '../../api/prices.queries';

// ----------------------------------------------------------------------

export function PricesListView() {
  const [includeHistory, setIncludeHistory] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [toExpire, setToExpire] = useState<Price | null>(null);

  const { data, isLoading, isError, error, refetch } = usePricesQuery({
    includeHistory,
    page: 1,
    limit: 500,
  });

  const expireMutation = useExpirePriceMutation();

  const { data: productOpts = [] } = useProductOptions();
  const { data: branchOpts = [] } = useBranchOptions();

  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const rows = data?.data ?? [];

  const handleExpire = async () => {
    if (!toExpire) return;
    try {
      await expireMutation.mutateAsync(toExpire.id);
      toast.success('Precio expirado. El producto volverá a usar la siguiente fuente de la cascada.');
      setToExpire(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Price>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2.2,
        minWidth: 240,
        valueGetter: (value: string) => productNameById.get(value) ?? value,
        renderCell: ({ value, row }) => (
          <Box>
            <Typography variant="subtitle2">{value as string}</Typography>
            <Typography variant="caption" color="text.disabled">
              {row.productId.slice(0, 8)}…
            </Typography>
          </Box>
        ),
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.3,
        minWidth: 180,
        renderCell: ({ row }) =>
          row.branchId ? (
            <Chip size="small" variant="outlined" label={branchNameById.get(row.branchId) ?? '—'} />
          ) : (
            <Chip size="small" color="info" variant="soft" label="Global" />
          ),
      },
      {
        field: 'priceUsd',
        headerName: 'Precio',
        flex: 1,
        minWidth: 120,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (
          <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {Number(value).toFixed(2)} USD
          </Typography>
        ),
      },
      {
        field: 'effectiveFrom',
        headerName: 'Vigente desde',
        type: 'dateTime',
        flex: 1.1,
        minWidth: 170,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
      {
        field: 'effectiveTo',
        headerName: 'Estado',
        flex: 1,
        minWidth: 150,
        renderCell: ({ row }) =>
          row.effectiveTo ? (
            <Tooltip title={`Expirado el ${new Date(row.effectiveTo).toLocaleString()}`}>
              <Chip size="small" color="default" variant="outlined" label="Expirado" />
            </Tooltip>
          ) : (
            <Chip size="small" color="success" variant="soft" label="Vigente" />
          ),
      },
      {
        field: 'notes',
        headerName: 'Notas',
        flex: 1.5,
        minWidth: 180,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 70,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          !row.effectiveTo ? (
            <Tooltip title="Expirar precio (effective_to = ahora)">
              <IconButton color="warning" onClick={() => setToExpire(row)}>
                <Iconify icon="solar:clock-circle-bold" />
              </IconButton>
            </Tooltip>
          ) : null,
      },
    ],
    [productNameById, branchNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Precios"
        subtitle="Gestión de precios de venta en USD. Override por sucursal opcional."
        crumbs={[{ label: 'Administración' }, { label: 'Precios' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setFormOpen(true)}
          >
            Nuevo precio
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ p: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={includeHistory}
                onChange={(_, checked) => setIncludeHistory(checked)}
              />
            }
            label="Incluir histórico (precios expirados)"
          />

          <Typography variant="caption" color="text.secondary">
            {rows.length} {rows.length === 1 ? 'precio' : 'precios'}
          </Typography>
        </Stack>

        {isError && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar precios'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rows}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            getRowId={(row) => row.id}
          />
        </Box>
      </Card>

      <PriceFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!toExpire}
        title="Expirar precio"
        description={
          toExpire ? (
            <>
              Esto fijará <strong>effective_to = ahora</strong> para el precio de{' '}
              <strong>{productNameById.get(toExpire.productId) ?? toExpire.productId}</strong>
              {toExpire.branchId && (
                <>
                  {' '}
                  en la sucursal{' '}
                  <strong>{branchNameById.get(toExpire.branchId) ?? toExpire.branchId}</strong>
                </>
              )}
              . El producto volverá a usar la siguiente fuente de la cascada (global o lote).
            </>
          ) : null
        }
        confirmLabel="Expirar"
        loading={expireMutation.isPending}
        onConfirm={handleExpire}
        onClose={() => setToExpire(null)}
      />
    </Container>
  );
}
