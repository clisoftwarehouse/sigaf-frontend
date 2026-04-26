import type { GridColDef } from '@mui/x-data-grid';
import type { ClaimType, SupplierClaim } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useClaimsQuery } from '../../api/claims.queries';
import {
  CLAIM_TYPE_LABEL,
  CLAIM_TYPE_OPTIONS,
  CLAIM_STATUS_COLOR,
  CLAIM_STATUS_LABEL,
  CLAIM_STATUS_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

export function ClaimsListView() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useClaimsQuery({ limit: 200 });

  const { data: supplierOpts = [] } = useSupplierOptions();
  const supplierNameById = useMemo(
    () => new Map(supplierOpts.map((o) => [o.id, o.label] as const)),
    [supplierOpts]
  );

  const supplierFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useSupplierOptions }),
    []
  );

  const columns = useMemo<GridColDef<SupplierClaim>[]>(
    () => [
      {
        field: 'claimNumber',
        headerName: 'Nº reclamo',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
            {row.claimNumber}
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
        sortComparator: (a, b) =>
          (supplierNameById.get(a) ?? '').localeCompare(supplierNameById.get(b) ?? ''),
      },
      {
        field: 'title',
        headerName: 'Asunto',
        flex: 2,
        minWidth: 260,
      },
      {
        field: 'claimType',
        headerName: 'Tipo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 130,
        valueOptions: CLAIM_TYPE_OPTIONS,
        valueFormatter: (value: ClaimType) => CLAIM_TYPE_LABEL[value] ?? value,
      },
      {
        field: 'status',
        headerName: 'Estado',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: CLAIM_STATUS_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            variant="soft"
            color={CLAIM_STATUS_COLOR[row.status]}
            label={CLAIM_STATUS_LABEL[row.status]}
          />
        ),
      },
      {
        field: 'amountUsd',
        headerName: 'Monto',
        type: 'number',
        flex: 1,
        minWidth: 120,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string | null) => (value != null ? Number(value) : null),
        valueFormatter: (value: number | null) =>
          value != null ? `$${value.toFixed(2)}` : '—',
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
            <IconButton onClick={() => router.push(paths.dashboard.claims.detail(row.id))}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [router, supplierFilterOperators, supplierNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Reclamos a proveedor"
        subtitle="Registra y da seguimiento a inconformidades sobre recepciones, calidad, cantidad o precio."
        crumbs={[{ label: 'Compras' }, { label: 'Reclamos' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.claims.new)}
          >
            Nuevo reclamo
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
            rows={data?.data}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}

