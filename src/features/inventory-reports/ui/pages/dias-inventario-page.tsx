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
import { fmtQty, exportPdf, exportXlsx } from '../../model/helpers';
import { useDiasInventario } from '../../api/inventory-reports.queries';

const STATUS = {
  quiebre: { label: 'Quiebre', color: 'error' },
  optimo: { label: 'Óptimo', color: 'success' },
  sobrestock: { label: 'Sobre-stock', color: 'warning' },
} as const;

export default function DiasInventarioPage() {
  const [windowDays, setWindowDays] = useState(30);
  const { data, isLoading, isError, error } = useDiasInventario({ windowDays });

  const headers = ['Producto', 'Código', 'Categoría', 'Stock actual', 'Prom. venta diaria', 'Días proyectados', 'Estado'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.productName,
      r.productCode ?? '',
      r.category ?? '',
      fmtQty(r.currentStock),
      fmtQty(r.dailyAvg),
      r.daysProjected ?? '∞',
      STATUS[r.status].label,
    ]);

  const file = `dias-inventario-${windowDays}d`;
  return (
    <ReportLayout
      title="Días de Inventario Disponible"
      subtitle="Días proyectados de inventario por producto (riesgo de quiebre / sobre-stock)."
      crumbs={[{ label: 'Reportes' }, { label: 'Días de inventario' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="error" variant="outlined" label={`Quiebre: ${data.resumen.quiebre}`} />
            <Chip size="small" color="warning" variant="outlined" label={`Sobre-stock: ${data.resumen.sobrestock}`} />
          </>
        )
      }
      filters={
        <TextField
          type="number"
          size="small"
          label="Ventana (días)"
          value={windowDays}
          onChange={(e) => setWindowDays(Math.max(1, Number(e.target.value) || 30))}
          sx={{ width: 150 }}
        />
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Dias inventario', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Días de Inventario Disponible', `Promedio de venta sobre ${windowDays} días`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay productos con stock."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Prom. diario</TableCell>
              <TableCell align="right">Días proyectados</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography>
                  {r.productCode && <Typography variant="caption" color="text.disabled">{r.productCode}</Typography>}
                </TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{r.category ?? '—'}</Typography></TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.currentStock)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.dailyAvg)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.daysProjected ?? '∞'}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={STATUS[r.status].color} label={STATUS[r.status].label} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
