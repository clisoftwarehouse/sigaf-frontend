import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableFooter from '@mui/material/TableFooter';

import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { useDevoluciones } from '../../api/sales-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

export default function DevolucionesPage() {
  const { selectedBranchId } = useBranchScope();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useDevoluciones({ from, to, branchId: selectedBranchId ?? undefined });

  const headers = ['Fecha', 'Sucursal', 'Cajero', 'Nota de crédito', 'Ticket original', 'Ítems', 'Monto USD', 'Reembolso'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      fmtDate(r.date),
      r.branchName ?? '',
      r.cashierName,
      r.creditNoteNumber,
      r.originalNumber ?? '',
      r.itemCount,
      fmtBs(r.totalUsd),
      r.refundMethods,
    ]);

  const file = `devoluciones-${from}_${to}`;
  return (
    <ReportLayout
      title="Reporte de Devoluciones"
      subtitle="Notas de crédito con ticket original y método de reembolso."
      crumbs={[{ label: 'Reportes' }, { label: 'Devoluciones' }]}
      summary={data && <Chip size="small" variant="outlined" color="error" label={`${data.resumen.lines} devoluciones · USD ${fmtBs(data.resumen.totalUsd)}`} />}
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Devoluciones', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Reporte de Devoluciones', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay devoluciones en el rango."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Cajero</TableCell>
              <TableCell>Nota de crédito</TableCell>
              <TableCell>Ticket original</TableCell>
              <TableCell align="right">Ítems</TableCell>
              <TableCell align="right">Monto USD</TableCell>
              <TableCell>Reembolso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{fmtDate(r.date)}</TableCell>
                <TableCell>{r.cashierName}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.creditNoteNumber}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.originalNumber ?? '—'}</TableCell>
                <TableCell align="right">{r.itemCount}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.totalUsd)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={r.refundMethods || '—'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
          {data && data.rows.length > 0 && (
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell colSpan={5}>TOTAL DEVUELTO</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalUsd)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Box>
    </ReportLayout>
  );
}
