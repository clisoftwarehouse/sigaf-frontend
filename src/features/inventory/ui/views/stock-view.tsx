import type { GridColDef } from '@mui/x-data-grid';
import type { InventoryLot } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useStockQuery } from '../../api/inventory.queries';
import { LotPickerDialog } from '../components/lot-picker-dialog';
import { AdjustmentDialog } from '../components/adjustment-dialog';

// ----------------------------------------------------------------------

type StockRow = {
  productId: string;
  branchId: string;
  totalQuantity: number | string;
  quantityReserved?: number | string | null;
  lotCount: number;
  nearestExpiration: string | null;
  lastCountDate?: string | null;
  lastCountQuantity?: number | string | null;
  lastMovementDate?: string | null;
};

export function StockView() {
  const router = useRouter();

  const [pickerRow, setPickerRow] = useState<StockRow | null>(null);
  const [adjustmentLot, setAdjustmentLot] = useState<InventoryLot | null>(null);

  const { data, isLoading, isError, error, refetch } = useStockQuery({
    page: 1,
    limit: 1000,
  });
  const rows = (data?.data ?? []) as StockRow[];

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

  const rowsWithId = useMemo(
    () => rows.map((r) => ({ ...r, id: `${r.productId}-${r.branchId}` })),
    [rows]
  );

  const columns = useMemo<GridColDef<StockRow & { id: string }>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 240,
        filterOperators: productFilterOperators,
        valueFormatter: (value: string) => productNameById.get(value) ?? '—',
        renderCell: ({ row }) => (
          <Typography
            variant="subtitle2"
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
        field: 'totalQuantity',
        headerName: 'Cantidad total',
        type: 'number',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: number | string) => Number(value) || 0,
        renderCell: ({ value }) => {
          const qty = value as number;
          const isOut = qty === 0;
          const isLow = qty > 0 && qty <= 10;
          return (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              alignItems="center"
              sx={{ width: '100%' }}
            >
              <Typography variant="subtitle2">{qty}</Typography>
              {isOut && <Chip size="small" color="error" label="Agotado" />}
              {isLow && <Chip size="small" color="warning" label="Bajo" />}
            </Stack>
          );
        },
      },
      {
        field: 'lotCount',
        headerName: 'Lotes',
        type: 'number',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'nearestExpiration',
        headerName: 'Vence primero',
        type: 'date',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string | null) => (value ? new Date(value) : null),
      },
      {
        field: 'quantityReserved',
        headerName: 'Reservado',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null | undefined) => Number(value) || 0,
      },
      {
        field: 'lastCountDate',
        headerName: 'Último conteo',
        type: 'date',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string | null | undefined) => (value ? new Date(value) : null),
        renderCell: ({ row, value }) => {
          if (!value) return '—';
          const qty = row.lastCountQuantity != null ? Number(row.lastCountQuantity) : null;
          return (
            <Tooltip title={qty != null ? `Cantidad contada: ${qty}` : ''}>
              <Typography variant="body2">{(value as Date).toLocaleDateString('es-VE')}</Typography>
            </Tooltip>
          );
        },
      },
      {
        field: 'lastMovementDate',
        headerName: 'Último movimiento',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string | null | undefined) => (value ? new Date(value) : null),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 120,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Stack direction="row">
            <Tooltip title="Ajustar lote">
              <IconButton onClick={() => setPickerRow(row)}>
                <Iconify icon="solar:eraser-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver lotes">
              <IconButton
                onClick={() => router.push(paths.dashboard.inventory.productDetail(row.productId))}
              >
                <Iconify icon="solar:box-minimalistic-bold" />
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
        title="Stock agregado"
        subtitle="Totales por producto y sucursal sumando todos los lotes disponibles."
        crumbs={[{ label: 'Inventario' }, { label: 'Stock' }]}
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
              {(error as Error)?.message ?? 'Error al cargar stock'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rowsWithId}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: {
                  quantityReserved: false,
                  lastCountDate: false,
                  lastMovementDate: false,
                },
              },
            }}
          />
        </Box>
      </Card>

      <LotPickerDialog
        open={!!pickerRow}
        productId={pickerRow?.productId ?? null}
        branchId={pickerRow?.branchId ?? null}
        productName={pickerRow ? productNameById.get(pickerRow.productId) : undefined}
        branchName={pickerRow ? branchNameById.get(pickerRow.branchId) : undefined}
        onClose={() => setPickerRow(null)}
        onPick={(lot) => {
          setPickerRow(null);
          setAdjustmentLot(lot);
        }}
      />

      <AdjustmentDialog lot={adjustmentLot} onClose={() => setAdjustmentLot(null)} />
    </Container>
  );
}
