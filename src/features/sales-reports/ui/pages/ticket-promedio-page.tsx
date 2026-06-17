import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { useTicketPromedio } from '../../api/sales-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, fmtQty, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

export default function TicketPromedioPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useTicketPromedio({ from, to });

  const headers = ['Fecha', 'Franja', 'Tickets', 'Unidades', 'UPT', 'VPT USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [fmtDate(r.date), r.band, r.tickets, fmtQty(r.units), fmtQty(r.upt), fmtBs(r.vptUsd)]);

  const file = `ticket-promedio-${from}_${to}`;
  return (
    <ReportLayout
      title="Ticket Promedio"
      subtitle="Valor promedio del ticket (VPT) y unidades por ticket (UPT) por día y franja horaria."
      crumbs={[{ label: 'Reportes' }, { label: 'Ticket promedio' }]}
      summary={
        data && (
          <>
            <Chip size="small" variant="outlined" color="info" label={`VPT: USD ${fmtBs(data.resumen.vptUsd)}`} />
            <Chip size="small" variant="outlined" label={`UPT: ${fmtQty(data.resumen.upt)}`} />
            <Chip size="small" variant="outlined" label={`${data.resumen.tickets} tickets`} />
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Ticket promedio', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Ticket Promedio', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay ventas en el rango."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Franja horaria</TableCell>
              <TableCell align="right">Tickets</TableCell>
              <TableCell align="right">Unidades</TableCell>
              <TableCell align="right">UPT</TableCell>
              <TableCell align="right">VPT USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{fmtDate(r.date)}</TableCell>
                <TableCell>{r.band}</TableCell>
                <TableCell align="right">{r.tickets}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.units)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.upt)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.vptUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
