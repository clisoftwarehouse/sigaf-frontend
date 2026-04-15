import type { GridColDef } from '@mui/x-data-grid';
import type { InventoryLot } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
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
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useLotsQuery } from '../../api/inventory.queries';
import { AdjustmentDialog } from '../components/adjustment-dialog';
import { QuarantineDialog } from '../components/quarantine-dialog';
import { ExpirySignalChip } from '../components/expiry-signal-chip';
import {
  LOT_STATUS_LABEL,
  LOT_STATUS_OPTIONS,
  EXPIRY_SIGNAL_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

export function LotsListView() {
  const router = useRouter();
  const [quarantineLot, setQuarantineLot] = useState<InventoryLot | null>(null);
  const [adjustmentLot, setAdjustmentLot] = useState<InventoryLot | null>(null);

  const { data, isLoading, isError, error, refetch } = useLotsQuery({
    page: 1,
    limit: 1000,
  });
  const lots = data?.data ?? [];

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: productOpts = [] } = useProductOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );
  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );
  const productFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useProductOptions }),
    []
  );

  const columns = useMemo<GridColDef<InventoryLot>[]>(
    () => [
      {
        field: 'lotNumber',
        headerName: 'Lote',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
            {row.lotNumber}
          </Typography>
        ),
      },
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 220,
        filterOperators: productFilterOperators,
        valueFormatter: (value: string) => productNameById.get(value) ?? '—',
        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{ color: 'primary.main', cursor: 'pointer' }}
            onClick={() => router.push(paths.dashboard.inventory.productDetail(row.productId))}
          >
            {productNameById.get(row.productId) ?? '—'}
          </Typography>
        ),
        sortComparator: (a, b) =>
          (productNameById.get(a) ?? '').localeCompare(productNameById.get(b) ?? ''),
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        filterOperators: branchFilterOperators,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (branchNameById.get(a) ?? '').localeCompare(branchNameById.get(b) ?? ''),
      },
      {
        field: 'expirationDate',
        headerName: 'Vencimiento',
        type: 'date',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
      {
        field: 'expirySignal',
        headerName: 'Señal',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: EXPIRY_SIGNAL_OPTIONS,
        renderCell: ({ row }) => <ExpirySignalChip signal={row.expirySignal} />,
      },
      {
        field: 'quantityAvailable',
        headerName: 'Disponible',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'salePrice',
        headerName: 'Precio',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'status',
        headerName: 'Estado',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: LOT_STATUS_OPTIONS,
        valueFormatter: (value: string) =>
          LOT_STATUS_LABEL[value as keyof typeof LOT_STATUS_LABEL] ?? value,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Stack direction="row">
            <Tooltip title="Editar">
              <IconButton
                onClick={() => router.push(paths.dashboard.inventory.lots.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Nuevo ajuste">
              <IconButton onClick={() => setAdjustmentLot(row)}>
                <Iconify icon="solar:eraser-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                row.status === 'quarantine' ? 'Liberar de cuarentena' : 'Enviar a cuarentena'
              }
            >
              <IconButton
                color={row.status === 'quarantine' ? 'primary' : 'warning'}
                onClick={() => setQuarantineLot(row)}
              >
                <Iconify icon="solar:danger-triangle-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [router, branchFilterOperators, productFilterOperators, branchNameById, productNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Lotes de inventario"
        subtitle="Cada lote tiene su propio vencimiento, costo y cantidad disponible."
        crumbs={[{ label: 'Inventario' }, { label: 'Lotes' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.inventory.lots.new)}
          >
            Nuevo lote
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
              {(error as Error)?.message ?? 'Error al cargar lotes'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={lots}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <QuarantineDialog lot={quarantineLot} onClose={() => setQuarantineLot(null)} />
      <AdjustmentDialog lot={adjustmentLot} onClose={() => setAdjustmentLot(null)} />
    </Container>
  );
}
