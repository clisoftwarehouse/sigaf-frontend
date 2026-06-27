import type { ProfitabilityPeriod } from '../../model/types';

import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fmt, fmtUsd } from '../components/format';
import { useLostSalesReport } from '../../api/intelligence.queries';

// ----------------------------------------------------------------------

const PERIODS: Array<{ value: ProfitabilityPeriod; label: string }> = [
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'semester', label: 'Semestre' },
  { value: 'year', label: 'Año' },
  { value: 'custom', label: 'Rango custom' },
];

const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('es-VE') : '—');

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
      </Typography>
    </Card>
  );
}

export function LostSalesView({ branchId }: { branchId: string }) {
  const [period, setPeriod] = useState<ProfitabilityPeriod>('quarter');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Reseteo de fechas no necesario, pero mantenemos consistencia de período.
  useEffect(() => {
    if (period !== 'custom') {
      setFrom('');
      setTo('');
    }
  }, [period]);

  const { data, isLoading, isError } = useLostSalesReport({
    period,
    branchId: branchId || undefined,
    from: period === 'custom' ? from || undefined : undefined,
    to: period === 'custom' ? to || undefined : undefined,
    limit: 200,
  });

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            select
            size="small"
            label="Período"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ProfitabilityPeriod)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          >
            {PERIODS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>

          {period === 'custom' && (
            <>
              <TextField
                type="date"
                size="small"
                label="Desde"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}

          {data && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: { md: 'auto' } }}>
              {data.period.from} → {data.period.to} · {data.period.days} días · sin sucursal = todas
            </Typography>
          )}
        </Stack>
      </Card>

      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">No se pudo cargar el reporte de ventas perdidas.</Alert>}

      {data && (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label="Plata perdida (est.)" value={fmtUsd(data.summary.lostRevenueUsd)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label="Unidades perdidas" value={fmt(data.summary.lostUnits, 0)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label="Eventos" value={fmt(data.summary.events, 0)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label="Productos" value={fmt(data.summary.products, 0)} />
            </Grid>
          </Grid>

          {data.items.length === 0 ? (
            <Alert severity="success">Sin ventas perdidas registradas en el período. 🎉</Alert>
          ) : (
            <Card sx={{ overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 44 }}>#</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Eventos</TableCell>
                    <TableCell align="right">Unid. perdidas</TableCell>
                    <TableCell align="right">Plata perdida (est.)</TableCell>
                    <TableCell align="center">Último</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((it, idx) => (
                    <TableRow key={it.productId} hover>
                      <TableCell sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography variant="body2" noWrap title={it.productName}>
                          {it.productName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmt(it.events, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmt(it.lostUnits, 0)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'error.dark' }}
                      >
                        {fmtUsd(it.lostRevenueUsd)}
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {fmtDate(it.lastOccurredAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </Stack>
  );
}
