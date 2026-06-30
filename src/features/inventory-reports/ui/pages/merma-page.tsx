import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableFooter from '@mui/material/TableFooter';

import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { ReportLayout } from '../components/report-layout';
import { useMerma } from '../../api/inventory-reports.queries';
import { fmtBs, today, fmtQty, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../model/helpers';

export default function MermaPage() {
  const { selectedBranchId } = useBranchScope();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useMerma({ from, to, branchId: selectedBranchId ?? undefined });

  const headers = ['Fecha', 'Producto', 'Código', 'Lote', 'Cantidad', 'Costo perdido USD', 'Causa', 'Motivo'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      fmtDate(r.date),
      r.productName,
      r.productCode ?? '',
      r.lotNumber ?? '',
      fmtQty(r.quantity),
      fmtBs(r.costLostUsd),
      r.cause,
      r.reason ?? '',
    ]);

  const file = `merma-${from}_${to}`;
  return (
    <ReportLayout
      title="Reporte de Merma"
      subtitle="Bajas de inventario (vencido, dañado, pérdida) con el costo perdido."
      crumbs={[{ label: 'Reportes' }, { label: 'Merma' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="error" variant="outlined" label={`Pérdida: USD ${fmtBs(data.resumen.totalCostUsd)}`} />
            {data.resumen.byCause.slice(0, 4).map((c) => (
              <Chip key={c.cause} size="small" variant="outlined" label={`${c.cause}: ${fmtBs(c.costUsd)}`} />
            ))}
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Merma', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Reporte de Merma', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay bajas de inventario en el rango."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Lote</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Costo perdido USD</TableCell>
              <TableCell>Causa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{fmtDate(r.date)}</TableCell>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography>
                  {r.reason && <Typography variant="caption" color="text.disabled" noWrap>{r.reason}</Typography>}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{r.lotNumber ?? '—'}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.quantity)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'error.main' }}>{fmtBs(r.costLostUsd)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={r.cause} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
          {data && data.rows.length > 0 && (
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell colSpan={3}>TOTAL ({data.resumen.lines})</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(data.resumen.totalQuantity)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalCostUsd)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Box>
    </ReportLayout>
  );
}
