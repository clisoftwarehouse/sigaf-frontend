import type { GridColDef } from '@mui/x-data-grid';
import type { Prescription, PrescriptionStatus } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { PRESCRIPTION_STATUSES } from '../../model/types';
import { usePrescriptionsQuery } from '../../api/prescriptions.queries';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
  active: 'Activo',
  partially_dispensed: 'Parcial',
  fully_dispensed: 'Dispensado',
  expired: 'Vencido',
  cancelled: 'Anulado',
};

const STATUS_COLOR: Record<
  PrescriptionStatus,
  'success' | 'warning' | 'info' | 'default' | 'error'
> = {
  active: 'success',
  partially_dispensed: 'warning',
  fully_dispensed: 'info',
  expired: 'default',
  cancelled: 'error',
};

export function PrescriptionsListView() {
  const router = useRouter();
  const [status, setStatus] = useState<PrescriptionStatus | ''>('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = usePrescriptionsQuery({
    status: status || undefined,
    search: search.trim() || undefined,
    limit: 100,
  });
  const rows = data?.data ?? [];

  const columns = useMemo<GridColDef<Prescription>[]>(
    () => [
      {
        field: 'issuedAt',
        headerName: 'Emisión',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) =>
          row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : '',
      },
      {
        field: 'customer',
        headerName: 'Cliente',
        flex: 2,
        minWidth: 200,
        renderCell: ({ row }) =>
          row.customer ? (
            <Box>
              <Typography variant="subtitle2">{row.customer.fullName}</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace' }}
              >
                {row.customer.documentType}-{row.customer.documentNumber}
              </Typography>
            </Box>
          ) : (
            '—'
          ),
      },
      {
        field: 'doctorName',
        headerName: 'Médico',
        flex: 1.5,
        minWidth: 160,
      },
      {
        field: 'items',
        headerName: 'Items',
        flex: 0.5,
        minWidth: 80,
        renderCell: ({ row }) => row.items?.length ?? 0,
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip
              size="small"
              color={STATUS_COLOR[row.status]}
              label={STATUS_LABEL[row.status]}
            />
          </Box>
        ),
      },
      {
        field: 'expiresAt',
        headerName: 'Vence',
        flex: 1,
        minWidth: 120,
        renderCell: ({ row }) =>
          row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '—',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Tooltip title="Ver">
              <IconButton
                onClick={() => router.push(paths.dashboard.pos.prescriptions.detail(row.id))}
              >
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [router]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Récipes"
        subtitle="Récipes médicos para productos controlados / antibióticos."
        crumbs={[{ label: 'POS' }, { label: 'Récipes' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.pos.prescriptions.new)}
          >
            Nuevo récipe
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            size="small"
            placeholder="Buscar por médico o número de récipe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 320 }}
          />

          <TextField
            select
            size="small"
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value as PrescriptionStatus | '')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {PRESCRIPTION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABEL[s]}
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
              {(error as Error)?.message ?? 'Error al cargar récipes'}
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
          />
        </Box>
      </Card>
    </Container>
  );
}
