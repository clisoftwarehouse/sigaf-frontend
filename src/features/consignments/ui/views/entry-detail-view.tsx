import type { GridColDef } from '@mui/x-data-grid';
import type { ConsignmentEntryItem } from '../../model/types';

import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { useEntryQuery } from '../../api/consignments.queries';
import { CONSIGNMENT_STATUS_COLOR } from '../../model/constants';

// ----------------------------------------------------------------------

export function EntryDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: entry, isLoading, isError, error } = useEntryQuery(id);

  const itemColumns = useMemo<GridColDef<ConsignmentEntryItem>[]>(
    () => [
      {
        field: 'lotNumber',
        headerName: 'Lote',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.lotNumber}
          </Typography>
        ),
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
        field: 'quantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'quantityRemaining',
        headerName: 'Restante',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
        cellClassName: 'remaining-cell',
      },
      {
        field: 'costUsd',
        headerName: 'Costo',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
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
    ],
    []
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Entrada de consignación"
        subtitle={entry ? new Date(entry.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Consignaciones' }, { label: 'Entradas' }, { label: 'Detalle' }]}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {entry && (
        <>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    color={CONSIGNMENT_STATUS_COLOR[entry.status]}
                    label={entry.status}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Comisión pactada
                </Typography>
                <Typography variant="h6">
                  {(Number(entry.commissionPct) || 0).toFixed(2)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Sucursal
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {entry.branchId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Proveedor
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {entry.supplierId}
                </Typography>
              </Box>
            </Stack>
            {entry.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {entry.notes}
              </Typography>
            )}
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems ({entry.items?.length ?? 0})
            </Typography>
            <Box
              sx={{
                width: '100%',
                '& .remaining-cell': { fontWeight: 600 },
              }}
            >
              <DataTable
                columns={itemColumns}
                rows={entry.items ?? []}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>
          </Card>
        </>
      )}
    </Container>
  );
}
