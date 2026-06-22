import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';

import { useReporteX } from '../../api/sales-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

const fmtDT = (s: string | null): string => (s ? new Date(s).toLocaleString('es-VE') : '—');

export default function ReporteXPage() {
  const router = useRouter();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useReporteX({ from, to });

  const headers = ['Sesión', 'Terminal', 'Cajero', 'Apertura', 'Cierre', 'Estatus', '1er ticket', 'Últ. ticket', 'Total USD', 'Diferencia USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.sessionId,
      r.terminalName ?? '',
      r.cashierName,
      fmtDT(r.openedAt),
      fmtDT(r.closedAt),
      r.status,
      r.firstTicket ?? '',
      r.lastTicket ?? '',
      fmtBs(r.totalSalesUsd),
      fmtBs(r.differenceUsd),
    ]);

  const file = `reporte-x-${from}_${to}`;
  return (
    <ReportLayout
      title="Reporte X (turnos de caja)"
      subtitle="Cortes de caja por sesión: total por método, primer/último ticket y diferencia."
      crumbs={[{ label: 'Reportes' }, { label: 'Reporte X' }]}
      summary={data && <Chip size="small" variant="outlined" color="info" label={`${data.resumen.sessions} sesiones · USD ${fmtBs(data.resumen.totalSalesUsd)}`} />}
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Reporte X', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Reporte X — Turnos de caja', `${from} — ${to}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay sesiones de caja en el rango."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Sesión</TableCell>
              <TableCell>Cajero</TableCell>
              <TableCell>Apertura</TableCell>
              <TableCell>Cierre</TableCell>
              <TableCell>Tickets</TableCell>
              <TableCell align="right">Total USD</TableCell>
              <TableCell align="right">Diferencia</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  {r.sessionId}
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{r.terminalName ?? ''}</Typography>
                </TableCell>
                <TableCell>{r.cashierName}</TableCell>
                <TableCell><Typography variant="caption">{fmtDT(r.openedAt)}</Typography></TableCell>
                <TableCell><Typography variant="caption">{fmtDT(r.closedAt)}</Typography></TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.firstTicket ?? '—'} → {r.lastTicket ?? '—'}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.totalSalesUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: Math.abs(r.differenceUsd) > 0.01 ? 'error.main' : 'success.main' }}>
                  {fmtBs(r.differenceUsd)}
                </TableCell>
                <TableCell align="right" sx={{ width: 48 }}>
                  <Tooltip title="Ver detalle de la sesión">
                    <IconButton
                      size="small"
                      onClick={() => router.push(paths.dashboard.pos.cashSessions.detail(r.id))}
                    >
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
