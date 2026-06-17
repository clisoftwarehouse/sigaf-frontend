import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ReportLayout } from '../components/report-layout';
import { useTransferencias } from '../../api/inventory-reports.queries';
import { today, fmtQty, fmtDate, exportPdf, exportXlsx, firstOfMonth } from '../../model/helpers';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  in_transit: 'En tránsito',
  completed: 'Completada',
  cancelled: 'Cancelada',
};
const STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'error'> = {
  draft: 'default',
  in_transit: 'info',
  completed: 'success',
  cancelled: 'error',
};

export default function TransferenciasPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error } = useTransferencias({ from, to, status: status || undefined });

  const headers = ['Número', 'Fecha', 'Tipo', 'Origen', 'Destino', 'Ítems', 'Cantidad', 'Estatus'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.transferNumber,
      fmtDate(r.transferDate),
      r.transferType,
      r.fromBranch ?? '',
      r.toBranch ?? '',
      r.itemCount,
      fmtQty(r.totalQuantity),
      STATUS_LABEL[r.status] ?? r.status,
    ]);

  const file = `transferencias-${from}_${to}`;
  return (
    <ReportLayout
      title="Reporte de Transferencias"
      subtitle="Transferencias entre sucursales/almacenes por estatus."
      crumbs={[{ label: 'Reportes' }, { label: 'Transferencias' }]}
      summary={data?.resumen.byStatus.map((s) => (
        <Chip key={s.status} size="small" variant="outlined" color={STATUS_COLOR[s.status]} label={`${STATUS_LABEL[s.status] ?? s.status}: ${s.count}`} />
      ))}
      filters={
        <>
          <TextField select size="small" label="Estatus" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="draft">Borrador</MenuItem>
            <MenuItem value="in_transit">En tránsito</MenuItem>
            <MenuItem value="completed">Completada</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
          </TextField>
          <TextField type="date" size="small" label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </>
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Transferencias', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Reporte de Transferencias', `${fmtDate(from)} — ${fmtDate(to)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay transferencias en el rango."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell align="right">Ítems</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Estatus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.transferNumber}</TableCell>
                <TableCell>{fmtDate(r.transferDate)}</TableCell>
                <TableCell><Typography variant="body2" noWrap>{r.fromBranch ?? '—'}</Typography></TableCell>
                <TableCell><Typography variant="body2" noWrap>{r.toBranch ?? '—'}</Typography></TableCell>
                <TableCell align="right">{r.itemCount}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.totalQuantity)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={STATUS_COLOR[r.status]} label={STATUS_LABEL[r.status] ?? r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
