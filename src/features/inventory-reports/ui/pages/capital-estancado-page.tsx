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

import { ReportLayout } from '../components/report-layout';
import { useCapitalEstancado } from '../../api/inventory-reports.queries';
import { fmtBs, fmtQty, fmtDate, exportPdf, exportXlsx } from '../../model/helpers';

export default function CapitalEstancadoPage() {
  const [minDays, setMinDays] = useState(90);
  const { data, isLoading, isError, error } = useCapitalEstancado({ minDays });

  const headers = ['Producto', 'Código', 'Proveedor', 'Lote', 'Última venta', 'Días sin mov.', 'Unidades', 'Capital atascado USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.productName,
      r.productCode ?? '',
      r.supplierName ?? '',
      r.lotNumber,
      r.lastMovementDate ? fmtDate(r.lastMovementDate) : 'Sin ventas',
      r.daysSinceMovement,
      fmtQty(r.units),
      fmtBs(r.valueStuckUsd),
    ]);

  const file = `capital-represado-${data?.asOf ?? ''}`;
  return (
    <ReportLayout
      title="Capital Represado"
      subtitle="Stock sin movimiento (dead stock) con el capital represado."
      crumbs={[{ label: 'Reportes' }, { label: 'Capital represado' }]}
      summary={data && <Chip size="small" color="error" variant="outlined" label={`Capital represado: USD ${fmtBs(data.resumen.totalValueUsd)} en ${data.resumen.lines} lotes`} />}
      filters={
        <TextField
          type="number"
          size="small"
          label="Días sin mov."
          value={minDays}
          onChange={(e) => setMinDays(Math.max(1, Number(e.target.value) || 90))}
          sx={{ width: 150 }}
        />
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Capital represado', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Capital Represado', `Sin movimiento ≥ ${minDays} días · al ${fmtDate(data?.asOf)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay stock represado con ese umbral."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Lote</TableCell>
              <TableCell>Última venta</TableCell>
              <TableCell align="right">Días</TableCell>
              <TableCell align="right">Unidades</TableCell>
              <TableCell align="right">Capital USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography>
                  <Typography variant="caption" color="text.disabled">{r.productCode ?? ''} {r.supplierName ? `· ${r.supplierName}` : ''}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{r.lotNumber}</TableCell>
                <TableCell>{r.lastMovementDate ? fmtDate(r.lastMovementDate) : <Typography variant="caption" color="error.main">Sin ventas</Typography>}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{r.daysSinceMovement}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.units)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.valueStuckUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {data && data.rows.length > 0 && (
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell colSpan={5}>TOTAL CAPITAL ATASCADO</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalValueUsd)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Box>
    </ReportLayout>
  );
}
