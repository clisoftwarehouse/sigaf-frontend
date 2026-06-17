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

import { usePacientesCronicos } from '../../api/crm-finance-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtDate, exportPdf, exportXlsx } from '../../../inventory-reports/model/helpers';

const STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  activo: { label: 'Activo', color: 'success' },
  por_recomprar: { label: 'Por recomprar', color: 'warning' },
  desertor: { label: 'Desertor', color: 'error' },
};

export default function PacientesCronicosPage() {
  const [lookbackDays, setLookbackDays] = useState(180);
  const { data, isLoading, isError, error } = usePacientesCronicos({ lookbackDays });

  const headers = ['Cliente', 'Documento', 'Producto', 'Compras', 'Última compra', 'Intervalo (días)', 'Próxima compra', 'Estatus'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.customerName,
      r.document,
      r.productName,
      r.purchases,
      fmtDate(r.lastPurchase),
      r.avgIntervalDays,
      fmtDate(r.nextExpected),
      STATUS[r.status]?.label ?? r.status,
    ]);

  const file = `pacientes-cronicos-${data?.asOf ?? ''}`;
  return (
    <ReportLayout
      title="Control de Pacientes Crónicos"
      subtitle="Clientes con recompra recurrente, próxima compra proyectada y estatus de adherencia."
      crumbs={[{ label: 'Reportes' }, { label: 'Pacientes crónicos' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="warning" variant="outlined" label={`Por recomprar: ${data.resumen.porRecomprar}`} />
            <Chip size="small" color="error" variant="outlined" label={`Desertores: ${data.resumen.desertores}`} />
          </>
        )
      }
      filters={
        <TextField
          type="number"
          size="small"
          label="Histórico (días)"
          value={lookbackDays}
          onChange={(e) => setLookbackDays(Math.max(30, Number(e.target.value) || 180))}
          sx={{ width: 150 }}
        />
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Pacientes cronicos', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Control de Pacientes Crónicos', `Histórico ${lookbackDays} días · al ${fmtDate(data?.asOf)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay clientes con recompra recurrente en el período."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Compras</TableCell>
              <TableCell>Última</TableCell>
              <TableCell align="right">Intervalo</TableCell>
              <TableCell>Próxima</TableCell>
              <TableCell>Estatus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap title={r.customerName}>{r.customerName}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>{r.document}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 220 }}><Typography variant="body2" noWrap title={r.productName}>{r.productName}</Typography></TableCell>
                <TableCell align="right">{r.purchases}</TableCell>
                <TableCell>{fmtDate(r.lastPurchase)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{r.avgIntervalDays}d</TableCell>
                <TableCell>{fmtDate(r.nextExpected)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={STATUS[r.status]?.color} label={STATUS[r.status]?.label ?? r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
