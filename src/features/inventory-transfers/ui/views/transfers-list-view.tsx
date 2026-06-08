import type { GridColDef } from '@mui/x-data-grid';
import type { InventoryTransfer } from '../../model/types';

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
import { DataTable } from '@/app/components/data-table';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useWarehouseOptions } from '@/features/warehouses/api/warehouses.options';

import { TypeChip, StatusChip } from '../components/transfer-chips';
import { useTransfersQuery } from '../../api/inventory-transfers.queries';

// ----------------------------------------------------------------------

export function TransfersListView() {
  const router = useRouter();
  const { data: paginated, isLoading, isError, error, refetch } = useTransfersQuery();
  const transfers = paginated?.data ?? [];

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: warehouseOpts = [] } = useWarehouseOptions();
  const branchById = useMemo(() => new Map(branchOpts.map((o) => [o.id, o.label] as const)), [branchOpts]);
  const warehouseById = useMemo(
    () => new Map(warehouseOpts.map((o) => [o.id, o.label] as const)),
    [warehouseOpts]
  );

  const columns = useMemo<GridColDef<InventoryTransfer>[]>(
    () => [
      {
        field: 'transferNumber',
        headerName: 'N°',
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.transferNumber}
          </Typography>
        ),
      },
      {
        field: 'transferDate',
        headerName: 'Fecha',
        minWidth: 110,
        valueFormatter: (v: string) => v?.slice(0, 10),
      },
      {
        field: 'transferType',
        headerName: 'Tipo',
        minWidth: 150,
        renderCell: ({ row }) => <TypeChip type={row.transferType} />,
      },
      {
        field: 'origin',
        headerName: 'Origen',
        flex: 1,
        minWidth: 200,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          const branch = branchById.get(row.fromBranchId) ?? row.fromBranchId;
          if (row.fromLocationId) {
            const wh = warehouseById.get(row.fromLocationId) ?? row.fromLocationId;
            return <span>{`${branch} · ${wh}`}</span>;
          }
          return <span>{branch}</span>;
        },
      },
      {
        field: 'destination',
        headerName: 'Destino',
        flex: 1,
        minWidth: 200,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          const branch = branchById.get(row.toBranchId) ?? row.toBranchId;
          if (row.toLocationId) {
            const wh = warehouseById.get(row.toLocationId) ?? row.toLocationId;
            return <span>{`${branch} · ${wh}`}</span>;
          }
          return <span>{branch}</span>;
        },
      },
      {
        field: 'status',
        headerName: 'Estado',
        minWidth: 140,
        renderCell: ({ row }) => <StatusChip status={row.status} />,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Ver detalle">
            <IconButton onClick={() => router.push(paths.dashboard.inventory.transfers.detail(row.id))}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [router, branchById, warehouseById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Transferencias de inventario"
        subtitle="Movimientos entre sucursales y entre almacenes."
        crumbs={[{ label: 'Inventario' }, { label: 'Transferencias' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.inventory.transfers.new)}
          >
            Nueva transferencia
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
              {(error as Error)?.message ?? 'Error al cargar transferencias'}
            </Alert>
          </Box>
        )}
        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={transfers}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
