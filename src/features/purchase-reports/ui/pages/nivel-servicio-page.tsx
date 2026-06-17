import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { useNivelServicio } from '../../api/purchase-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { today, fmtQty, fmtPct, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../../inventory-reports/model/helpers';

const STATUS: Record<string, { label: string; color: 'default' | 'warning' | 'success' }> = {
  pendiente: { label: 'Pendiente', color: 'warning' },
  parcial: { label: 'Parcial', color: 'warning' },
  completa: { label: 'Completa', color: 'success' },
};

export default function NivelServicioPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useNivelServicio({ from, to });

  const headers = ['OC', 'Fecha', 'Proveedor', 'Sucursal', 'Ordenado', 'Recibido', 'Faltante', 'Fill rate %', 'Estatus', 'Esperada', 'Entregada', 'Días retraso'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.orderNumber,
      fmtDate(r.orderDate),
      r.supplierName ?? '',
      r.branchName ?? '',
      fmtQty(r.orderedQty),
      fmtQty(r.receivedQty),
      fmtQty(r.pendingQty),
      fmtPct(r.fillRatePct),
      STATUS[r.status]?.label ?? r.status,
      r.expectedDate ? fmtDate(r.expectedDate) : '',
      r.deliveryDate ? fmtDate(r.deliveryDate) : '',
      r.daysLate ?? '',
    ]);

  const file = `nivel-servicio-${from}_${to}`;
  return (
    <ReportLayout
      title="Nivel de Servicio de Proveedores"
      subtitle="Fill rate y días de retraso por orden de compra."
      crumbs={[{ label: 'Reportes' }, { label: 'Nivel de servicio' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="info" variant="outlined" label={`Fill rate prom.: ${fmtPct(data.resumen.avgFillRatePct)}`} />
            <Chip size="small" color="error" variant="outlined" label={`${data.resumen.lateOrders} con retraso`} />
            <Chip size="small" variant="outlined" label={`${data.resumen.orders} OCs`} />
          </>
        )
      }
      filters={
        <>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Nivel servicio', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Nivel de Servicio', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay órdenes de compra en el rango."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>OC</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell align="right">Ordenado</TableCell>
              <TableCell align="right">Recibido</TableCell>
              <TableCell align="right">Fill rate</TableCell>
              <TableCell>Estatus</TableCell>
              <TableCell align="right">Días retraso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{r.orderNumber}</TableCell>
                <TableCell>{fmtDate(r.orderDate)}</TableCell>
                <TableCell>{r.supplierName ?? '—'}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.orderedQty)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.receivedQty)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtPct(r.fillRatePct)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={STATUS[r.status]?.color} label={STATUS[r.status]?.label ?? r.status} /></TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: (r.daysLate ?? 0) > 0 ? 'error.main' : 'inherit' }}>{r.daysLate ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
