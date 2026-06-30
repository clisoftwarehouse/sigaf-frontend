import { useState } from 'react';
import { useNavigate } from 'react-router';

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

import { paths } from '@/app/routes/paths';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { useTransacciones } from '../../api/sales-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, fmtQty, fmtPct, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

export default function TransaccionesPage() {
  const navigate = useNavigate();
  const { selectedBranchId } = useBranchScope();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useTransacciones({ from, to, branchId: selectedBranchId ?? undefined });

  const headers = ['Fecha', 'Ticket', 'Cajero', 'Categoría', 'EAN', 'Producto', 'Cant', 'Precio USD', 'Desc %', 'Final USD', 'Costo USD', 'Margen USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      fmtDate(r.date),
      r.ticketNumber,
      r.cashierName,
      r.category ?? '',
      r.ean ?? '',
      r.productName,
      fmtQty(r.quantity),
      fmtBs(r.unitPriceUsd),
      fmtPct(r.discountPct),
      fmtBs(r.finalLineUsd),
      fmtBs(r.costUsd),
      fmtBs(r.marginUsd),
    ]);

  const file = `transacciones-${from}_${to}`;
  return (
    <ReportLayout
      title="Reporte de Transacciones"
      subtitle="Detalle de ventas línea a línea con costo y margen de contribución."
      crumbs={[{ label: 'Reportes' }, { label: 'Transacciones' }]}
      summary={
        data && (
          <>
            <Chip size="small" variant="outlined" label={`${data.resumen.lines} líneas`} />
            <Chip size="small" variant="outlined" color="success" label={`Margen: USD ${fmtBs(data.resumen.totalMarginUsd)}`} />
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Transacciones', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Reporte de Transacciones', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay transacciones en el rango."
    >
      <Box sx={{ overflow: 'auto', maxHeight: '70vh' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Ticket</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Cant</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Desc</TableCell>
              <TableCell align="right">Final USD</TableCell>
              <TableCell align="right">Costo</TableCell>
              <TableCell align="right">Margen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{fmtDate(r.date)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <Box
                    component="span"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(paths.dashboard.admin.ventaDetail(r.ticketId))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(paths.dashboard.admin.ventaDetail(r.ticketId));
                    }}
                    sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    title="Ver la venta"
                  >
                    {r.ticketNumber}
                  </Box>
                </TableCell>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography>
                  <Typography variant="caption" color="text.disabled">{r.category ?? ''} {r.ean ? `· ${r.ean}` : ''}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.quantity)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(r.unitPriceUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{fmtPct(r.discountPct)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.finalLineUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{fmtBs(r.costUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: r.marginUsd < 0 ? 'error.main' : 'success.main' }}>{fmtBs(r.marginUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {data && data.rows.length > 0 && (
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell colSpan={6}>TOTAL ({data.resumen.lines})</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalCostUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalMarginUsd)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Box>
    </ReportLayout>
  );
}
