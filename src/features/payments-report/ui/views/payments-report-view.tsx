import type { GridColDef } from '@mui/x-data-grid';
import type { PaymentRow, PaymentMethod, PaymentsSummaryRow } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useTerminalsQuery } from '@/features/terminals/api/terminals.queries';

import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from '../../model/types';
import { usePaymentsReportQuery } from '../../api/payments-report.queries';

// ----------------------------------------------------------------------

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const bsFmt = new Intl.NumberFormat('es-VE', {
  style: 'currency',
  currency: 'VES',
  minimumFractionDigits: 2,
});

function toIsoStart(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00`).toISOString();
}

function toIsoEnd(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function downloadCsv(rows: PaymentRow[]) {
  const header = [
    'Fecha',
    'Ticket',
    'Tipo',
    'Estado',
    'Sucursal',
    'Terminal',
    'Cliente',
    'Método',
    'USD',
    'Bs',
    'Tasa',
    'Referencia',
    'Card',
  ];
  const body = rows.map((r) =>
    [
      new Date(r.createdAt).toISOString(),
      r.ticketNumber,
      r.ticketType,
      r.ticketStatus,
      r.branchName ?? '',
      r.terminalCode ?? '',
      r.customerName ?? '',
      r.paymentMethod,
      r.amountUsd.toFixed(2),
      r.amountBs.toFixed(2),
      r.exchangeRateUsed?.toFixed(4) ?? '',
      r.referenceNumber ?? '',
      r.cardLast4 ?? '',
    ]
      .map((cell) => {
        const s = String(cell);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',')
  );
  const csv = [header.join(','), ...body].join('\n');
  const blob = new Blob([`${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pagos_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SummaryCard({ row }: { row: PaymentsSummaryRow }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="text.secondary">
              {PAYMENT_METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800 }}>
              {usdFmt.format(row.totalUsd)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {bsFmt.format(row.totalBs)}
            </Typography>
          </Box>
          <Chip size="small" label={`${row.count} pagos`} variant="outlined" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function PaymentsReportView() {
  // Por defecto: hoy.
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState<string>(today);
  const [to, setTo] = useState<string>(today);
  const [branchId, setBranchId] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const branchesQuery = useBranchesQuery();
  const terminalsQuery = useTerminalsQuery(branchId ? { branchId } : {});

  const filters = useMemo(
    () => ({
      from: toIsoStart(from),
      to: toIsoEnd(to),
      branchId: branchId || undefined,
      terminalId: terminalId || undefined,
      paymentMethod: paymentMethod || undefined,
      page: page + 1,
      limit: pageSize,
    }),
    [from, to, branchId, terminalId, paymentMethod, page, pageSize]
  );

  const reportQuery = usePaymentsReportQuery(filters);
  const data = reportQuery.data?.data ?? [];
  const summary = reportQuery.data?.summary ?? [];
  const total = reportQuery.data?.total ?? 0;

  const totalsAll = useMemo(
    () =>
      summary.reduce(
        (acc, s) => ({
          count: acc.count + s.count,
          totalUsd: acc.totalUsd + s.totalUsd,
          totalBs: acc.totalBs + s.totalBs,
        }),
        { count: 0, totalUsd: 0, totalBs: 0 }
      ),
    [summary]
  );

  const columns = useMemo<GridColDef<PaymentRow>[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Fecha',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => new Date(row.createdAt).toLocaleString(),
      },
      {
        field: 'ticketNumber',
        headerName: 'Ticket',
        width: 110,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              #{row.ticketNumber}
            </Typography>
            {row.ticketType === 'return' && <Chip size="small" color="warning" label="DEV" />}
            {row.ticketStatus === 'voided' && <Chip size="small" color="error" label="ANUL" />}
          </Stack>
        ),
      },
      {
        field: 'branchName',
        headerName: 'Sucursal',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => row.branchName ?? '—',
      },
      {
        field: 'terminalCode',
        headerName: 'Terminal',
        width: 110,
        renderCell: ({ row }) => row.terminalCode ?? '—',
      },
      {
        field: 'customerName',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => row.customerName ?? 'Mostrador',
      },
      {
        field: 'paymentMethod',
        headerName: 'Método',
        width: 130,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={PAYMENT_METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod}
            variant="outlined"
          />
        ),
      },
      {
        field: 'amountUsd',
        headerName: 'USD',
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: row.amountUsd < 0 ? 'error.main' : 'text.primary',
            }}
          >
            {usdFmt.format(row.amountUsd)}
          </Typography>
        ),
      },
      {
        field: 'amountBs',
        headerName: 'Bs',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: row.amountBs < 0 ? 'error.main' : 'text.secondary',
            }}
          >
            {bsFmt.format(row.amountBs)}
          </Typography>
        ),
      },
      {
        field: 'referenceNumber',
        headerName: 'Referencia',
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => row.referenceNumber ?? row.cardLast4 ?? '—',
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Reporte de pagos por método"
        subtitle="Pagos cobrados (y devoluciones) agregados por método, sucursal y terminal."
        crumbs={[{ label: 'Punto de venta' }, { label: 'Reporte de pagos' }]}
      />

      <Card sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            select
            size="small"
            label="Sucursal"
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setTerminalId('');
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {(branchesQuery.data ?? []).map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Terminal"
            value={terminalId}
            onChange={(e) => {
              setTerminalId(e.target.value);
              setPage(0);
            }}
            disabled={!branchId}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(terminalsQuery.data ?? []).map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.code}
                {t.name ? ` · ${t.name}` : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Método"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as PaymentMethod | '');
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={() => downloadCsv(data)}
            disabled={data.length === 0}
          >
            Exportar CSV
          </Button>
        </Stack>
      </Card>

      {reportQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => reportQuery.refetch()}>
              Reintentar
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {(reportQuery.error as Error)?.message ?? 'Error al cargar pagos'}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%', bgcolor: 'primary.lighter' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total general
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 900 }}>
                {usdFmt.format(totalsAll.totalUsd)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {bsFmt.format(totalsAll.totalBs)} · {totalsAll.count} pagos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {summary.map((s) => (
          <Grid key={s.paymentMethod} size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard row={s} />
          </Grid>
        ))}
      </Grid>

      <Card>
        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={data}
            getRowId={(row) => row.paymentId}
            loading={reportQuery.isLoading || reportQuery.isFetching}
            disableRowSelectionOnClick
            autoHeight
            paginationMode="server"
            rowCount={total}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Box>
      </Card>
    </Container>
  );
}
