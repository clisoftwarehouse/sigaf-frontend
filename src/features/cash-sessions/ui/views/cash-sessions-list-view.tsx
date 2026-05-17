import type { GridColDef } from '@mui/x-data-grid';
import type { CashSession, CashSessionStatus } from '../../model/types';

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

import { CASH_SESSION_STATUSES } from '../../model/types';
import { useCashSessionsQuery } from '../../api/cash-sessions.queries';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<CashSessionStatus, string> = {
  open: 'Abierta',
  closed: 'Cerrada',
  audited: 'Auditada',
};

const STATUS_COLOR: Record<CashSessionStatus, 'success' | 'default' | 'info'> = {
  open: 'success',
  closed: 'default',
  audited: 'info',
};

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function CashSessionsListView() {
  const router = useRouter();
  const [status, setStatus] = useState<CashSessionStatus | ''>('');

  const { data, isLoading, isError, error, refetch } = useCashSessionsQuery({
    status: status || undefined,
    limit: 100,
  });
  const rows = data?.data ?? [];

  const columns = useMemo<GridColDef<CashSession>[]>(
    () => [
      {
        field: 'openedAt',
        headerName: 'Apertura',
        flex: 1,
        minWidth: 170,
        renderCell: ({ row }) =>
          row.openedAt ? new Date(row.openedAt).toLocaleString() : '',
      },
      {
        field: 'terminal',
        headerName: 'Terminal',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) =>
          row.terminal ? (
            <Box>
              <Typography variant="subtitle2">{row.terminal.code}</Typography>
              {row.terminal.name && (
                <Typography variant="caption" color="text.secondary">
                  {row.terminal.name}
                </Typography>
              )}
            </Box>
          ) : (
            row.terminalId.slice(0, 8)
          ),
      },
      {
        field: 'branch',
        headerName: 'Sucursal',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => row.branch?.name ?? '—',
      },
      {
        field: 'openedBy',
        headerName: 'Abierta por',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) =>
          row.openedBy?.fullName ?? row.openedBy?.username ?? '—',
      },
      {
        field: 'openingAmountUsd',
        headerName: 'Apertura USD',
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => usdFmt.format(Number(row.openingAmountUsd)),
      },
      {
        field: 'closedAt',
        headerName: 'Cierre',
        flex: 1,
        minWidth: 170,
        renderCell: ({ row }) =>
          row.closedAt ? new Date(row.closedAt).toLocaleString() : '—',
      },
      {
        field: 'differenceUsd',
        headerName: 'Diferencia',
        flex: 0.8,
        minWidth: 110,
        renderCell: ({ row }) => {
          if (row.differenceUsd === null || row.differenceUsd === undefined) return '—';
          const diff = Number(row.differenceUsd);
          const color = Math.abs(diff) < 0.01 ? 'success.main' : diff < 0 ? 'error.main' : 'warning.main';
          return (
            <Typography variant="body2" sx={{ color, fontFamily: 'monospace' }}>
              {usdFmt.format(diff)}
            </Typography>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 0.7,
        minWidth: 120,
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
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Tooltip title="Ver detalle">
              <IconButton
                onClick={() => router.push(paths.dashboard.pos.cashSessions.detail(row.id))}
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
        title="Sesiones de caja"
        subtitle="Apertura, cierre y arqueo de cajas por turno."
        crumbs={[{ label: 'POS' }, { label: 'Sesiones de caja' }]}
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            select
            size="small"
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value as CashSessionStatus | '')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {CASH_SESSION_STATUSES.map((s) => (
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
              {(error as Error)?.message ?? 'Error al cargar sesiones'}
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
