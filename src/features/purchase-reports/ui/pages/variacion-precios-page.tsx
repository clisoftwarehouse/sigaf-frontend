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

import { useVariacion } from '../../api/purchase-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, fmtPct, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

export default function VariacionPreciosPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useVariacion({ from, to });

  const headers = ['Fecha', 'Recepción', 'Proveedor', 'Producto', 'Costo OC USD', 'Costo facturado USD', 'Variación USD', 'Variación %', 'Causa', 'Aprobó'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      fmtDate(r.receiptDate),
      r.receiptNumber,
      r.supplierName ?? '',
      r.productName,
      fmtBs(r.negotiatedCostUsd),
      fmtBs(r.invoicedCostUsd),
      fmtBs(r.varianceAbsUsd),
      fmtPct(r.variancePct),
      r.cause ?? '',
      r.approver ?? '',
    ]);

  const file = `variacion-precios-${from}_${to}`;
  return (
    <ReportLayout
      title="Variación de Precios de Compra"
      subtitle="Diferencia entre el costo negociado (OC) y el facturado en la recepción."
      crumbs={[{ label: 'Reportes' }, { label: 'Variación de precios' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="error" variant="outlined" label={`${data.resumen.increases} subidas`} />
            <Chip size="small" color="success" variant="outlined" label={`${data.resumen.decreases} bajadas`} />
            <Chip size="small" variant="outlined" label={`Neto: USD ${fmtBs(data.resumen.totalVarianceUsd)}`} />
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Variacion precios', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Variación de Precios de Compra', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay variaciones de precio en el rango (recepciones ligadas a OC)."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Costo OC</TableCell>
              <TableCell align="right">Costo facturado</TableCell>
              <TableCell align="right">Variación</TableCell>
              <TableCell align="right">%</TableCell>
              <TableCell>Causa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{fmtDate(r.receiptDate)}</TableCell>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography>
                  <Typography variant="caption" color="text.disabled">{r.supplierName ?? ''}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{fmtBs(r.negotiatedCostUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(r.invoicedCostUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700, color: r.varianceAbsUsd > 0 ? 'error.main' : 'success.main' }}>{fmtBs(r.varianceAbsUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: r.variancePct > 0 ? 'error.main' : 'success.main' }}>{fmtPct(r.variancePct)}</TableCell>
                <TableCell><Typography variant="caption" color="text.secondary" noWrap>{r.cause ?? '—'}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
