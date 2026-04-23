import type { GridColDef } from '@mui/x-data-grid';
import type { ReceiptType, GoodsReceipt } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useOrdersQuery, useReceiptsQuery } from '../../api/purchases.queries';
import { RECEIPT_TYPE_LABEL, RECEIPT_TYPE_OPTIONS } from '../../model/constants';

// ----------------------------------------------------------------------

export function ReceiptsListView() {
  const router = useRouter();

  const { data: receipts, isLoading, isError, error, refetch } = useReceiptsQuery();
  const { data: ordersData } = useOrdersQuery({ page: 1, limit: 1000 });
  const orderNumberById = useMemo(
    () => new Map((ordersData?.data ?? []).map((o) => [o.id, o.orderNumber] as const)),
    [ordersData]
  );

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: supplierOpts = [] } = useSupplierOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );
  const supplierNameById = useMemo(
    () => new Map(supplierOpts.map((o) => [o.id, o.label] as const)),
    [supplierOpts]
  );

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );
  const supplierFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useSupplierOptions }),
    []
  );

  const columns = useMemo<GridColDef<GoodsReceipt>[]>(
    () => [
      {
        field: 'receiptNumber',
        headerName: 'Nº recepción',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
            {row.receiptNumber}
          </Typography>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Fecha',
        type: 'dateTime',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string) => new Date(value),
      },
      {
        field: 'supplierId',
        headerName: 'Proveedor',
        flex: 2,
        minWidth: 220,
        filterOperators: supplierFilterOperators,
        valueFormatter: (value: string) => supplierNameById.get(value) ?? value,
        renderCell: ({ row }) => (
          <Typography variant="body2">
            {supplierNameById.get(row.supplierId) ?? row.supplierId}
          </Typography>
        ),
        sortComparator: (a, b) =>
          (supplierNameById.get(a) ?? '').localeCompare(supplierNameById.get(b) ?? ''),
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
        field: 'supplierInvoiceNumber',
        headerName: 'Factura',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string | null) => value ?? '—',
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'purchaseOrderId',
        headerName: 'Nº OC',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) =>
          value ? (orderNumberById.get(value) ?? value.slice(0, 8)) : '—',
        renderCell: ({ row }) =>
          row.purchaseOrderId ? (
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                color: 'primary.main',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(paths.dashboard.purchases.orders.detail(row.purchaseOrderId!));
              }}
            >
              {orderNumberById.get(row.purchaseOrderId) ?? row.purchaseOrderId.slice(0, 8)}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              —
            </Typography>
          ),
      },
      {
        field: 'receiptType',
        headerName: 'Tipo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: RECEIPT_TYPE_OPTIONS,
        valueFormatter: (value: ReceiptType) => RECEIPT_TYPE_LABEL[value] ?? value,
      },
      {
        field: 'totalUsd',
        headerName: 'Total',
        type: 'number',
        flex: 1,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Ver">
            <IconButton
              onClick={() => router.push(paths.dashboard.purchases.receipts.detail(row.id))}
            >
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [
      router,
      branchFilterOperators,
      supplierFilterOperators,
      branchNameById,
      supplierNameById,
      orderNumberById,
    ]
  );

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

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={receipts?.data}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
