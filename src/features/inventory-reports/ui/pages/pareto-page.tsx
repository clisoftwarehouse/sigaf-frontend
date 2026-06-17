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

import { ReportLayout } from '../components/report-layout';
import { usePareto } from '../../api/inventory-reports.queries';
import { fmtBs, today, fmtQty, fmtPct, fmtDate, exportPdf, exportXlsx, firstOfQuarter } from '../../model/helpers';

const ABC_COLOR = { A: 'success', B: 'info', C: 'default' } as const;

export default function ParetoPage() {
  const [from, setFrom] = useState(firstOfQuarter);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = usePareto({ from, to });

  const headers = ['Producto', 'Código', 'Categoría', 'Ventas USD', 'Participación %', 'Acumulado %', 'Clase', 'Unidades'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.productName,
      r.productCode ?? '',
      r.category ?? '',
      fmtBs(r.salesUsd),
      fmtPct(r.participationPct),
      fmtPct(r.cumulativePct),
      r.abcClass,
      fmtQty(r.unitsSold),
    ]);

  const file = `pareto-${from}_${to}`;
  return (
    <ReportLayout
      title="Pareto de Inventario"
      subtitle="Clasificación ABC por ventas (A ≤80% acumulado, B ≤95%, C resto)."
      crumbs={[{ label: 'Reportes' }, { label: 'Pareto de inventario' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="success" variant="outlined" label={`A: ${data.resumen.aCount}`} />
            <Chip size="small" color="info" variant="outlined" label={`B: ${data.resumen.bCount}`} />
            <Chip size="small" variant="outlined" label={`C: ${data.resumen.cCount}`} />
            <Chip size="small" variant="outlined" label={`Ventas: USD ${fmtBs(data.resumen.totalSalesUsd)}`} />
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Pareto', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Pareto de Inventario', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
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
              <TableCell>Producto</TableCell>
              <TableCell align="right">Ventas USD</TableCell>
              <TableCell align="right">Part. %</TableCell>
              <TableCell align="right">Acum. %</TableCell>
              <TableCell>Clase</TableCell>
              <TableCell align="right">Unidades</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 280 }}>
                  <Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography>
                  <Typography variant="caption" color="text.disabled">{r.productCode ?? ''} {r.category ? `· ${r.category}` : ''}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.salesUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtPct(r.participationPct)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{fmtPct(r.cumulativePct)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={ABC_COLOR[r.abcClass]} label={r.abcClass} /></TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.unitsSold)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
