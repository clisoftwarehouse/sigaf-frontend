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

import { useEfectividadPromos } from '../../api/sales-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, today, fmtQty, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

const TYPE_LABEL: Record<string, string> = {
  percentage: 'Porcentaje',
  fixed_amount: 'Monto fijo',
  buy_x_get_y: 'Lleva X paga Y',
};

export default function EfectividadPromocionesPage() {
  const { selectedBranchId } = useBranchScope();
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useEfectividadPromos({ from, to, branchId: selectedBranchId ?? undefined });

  const headers = ['Promoción', 'Tipo', 'Líneas', 'Unidades', 'Vendido USD', 'Descontado USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.promotionName,
      TYPE_LABEL[r.promotionType] ?? r.promotionType,
      r.lines,
      fmtQty(r.units),
      fmtBs(r.soldUsd),
      fmtBs(r.discountUsd),
    ]);

  const file = `efectividad-promociones-${from}_${to}`;
  return (
    <ReportLayout
      title="Efectividad de Promociones"
      subtitle="Unidades, venta y descuento generados por cada promoción aplicada."
      crumbs={[{ label: 'Reportes' }, { label: 'Efectividad de promociones' }]}
      summary={
        data && (
          <>
            <Chip size="small" variant="outlined" label={`${data.resumen.promos} promos`} />
            <Chip size="small" color="success" variant="outlined" label={`Vendido: USD ${fmtBs(data.resumen.totalSoldUsd)}`} />
            <Chip size="small" color="error" variant="outlined" label={`Descontado: USD ${fmtBs(data.resumen.totalDiscountUsd)}`} />
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Efectividad promos', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Efectividad de Promociones', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay ventas con promoción registrada en el rango. (Solo las ventas posteriores a esta función registran la promo aplicada.)"
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Promoción</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Líneas</TableCell>
              <TableCell align="right">Unidades</TableCell>
              <TableCell align="right">Vendido USD</TableCell>
              <TableCell align="right">Descontado USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{r.promotionName}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={TYPE_LABEL[r.promotionType] ?? r.promotionType} /></TableCell>
                <TableCell align="right">{r.lines}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.units)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.soldUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'error.main' }}>{fmtBs(r.discountUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {data && data.rows.length > 0 && (
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell colSpan={4}>TOTAL ({data.resumen.promos})</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalSoldUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalDiscountUsd)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Box>
    </ReportLayout>
  );
}
