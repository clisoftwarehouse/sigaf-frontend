import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { useProductividad } from '../../api/sales-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, fmtQty, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

export default function ProductividadPage() {
  const { selectedBranchId } = useBranchScope();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useProductividad({ from, to, branchId: selectedBranchId ?? undefined });

  const headers = ['Cajero', 'Tickets', 'Unidades', 'Facturado USD', 'Ticket prom. USD', 'Sesiones', 'Dif. caja USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.cashierName,
      r.tickets,
      fmtQty(r.units),
      fmtBs(r.totalUsd),
      fmtBs(r.avgTicketUsd),
      r.sessions,
      fmtBs(r.cashDiffUsd),
    ]);

  const file = `productividad-cajero-${from}_${to}`;
  return (
    <ReportLayout
      title="Productividad por Cajero"
      subtitle="Tickets, unidades, facturación y diferencia de caja por cajero."
      crumbs={[{ label: 'Reportes' }, { label: 'Productividad por cajero' }]}
      summary={data && <Chip size="small" variant="outlined" color="info" label={`${data.resumen.cashiers} cajeros · ${data.resumen.tickets} tickets · USD ${fmtBs(data.resumen.totalUsd)}`} />}
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Productividad', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Productividad por Cajero', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
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
              <TableCell>Cajero</TableCell>
              <TableCell align="right">Tickets</TableCell>
              <TableCell align="right">Unidades</TableCell>
              <TableCell align="right">Facturado USD</TableCell>
              <TableCell align="right">Ticket prom.</TableCell>
              <TableCell align="right">Sesiones</TableCell>
              <TableCell align="right">Dif. caja USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{r.cashierName}</TableCell>
                <TableCell align="right">{r.tickets}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.units)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.totalUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(r.avgTicketUsd)}</TableCell>
                <TableCell align="right">{r.sessions}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: Math.abs(r.cashDiffUsd) > 0.01 ? 'error.main' : 'inherit' }}>{fmtBs(r.cashDiffUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
