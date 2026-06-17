import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useComportamiento } from '../../api/crm-finance-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, fmtDate, exportPdf, exportXlsx } from '../../../inventory-reports/model/helpers';

const SEGMENT: Record<string, { label: string; color: 'success' | 'info' | 'default' }> = {
  VIP: { label: 'VIP', color: 'success' },
  recurrente: { label: 'Recurrente', color: 'info' },
  esporadico: { label: 'Esporádico', color: 'default' },
};

export default function ComportamientoClientesPage() {
  const { data, isLoading, isError, error } = useComportamiento({});

  const headers = ['Cliente', 'Documento', 'Tipo', 'Primera compra', 'Última compra', 'Tickets', 'Total USD', 'Categoría top', 'Segmento'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.customerName,
      r.document,
      r.customerType,
      fmtDate(r.firstPurchase),
      fmtDate(r.lastPurchase),
      r.tickets,
      fmtBs(r.totalUsd),
      r.topCategory ?? '',
      SEGMENT[r.segment]?.label ?? r.segment,
    ]);

  const file = `comportamiento-clientes-${data?.asOf ?? ''}`;
  return (
    <ReportLayout
      title="Comportamiento de Clientes"
      subtitle="Frecuencia, total histórico, categoría de mayor compra y segmentación (RFM)."
      crumbs={[{ label: 'Reportes' }, { label: 'Comportamiento de clientes' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="success" variant="outlined" label={`VIP: ${data.resumen.vip}`} />
            <Chip size="small" color="info" variant="outlined" label={`Recurrentes: ${data.resumen.recurrentes}`} />
            <Chip size="small" variant="outlined" label={`${data.resumen.customers} clientes · USD ${fmtBs(data.resumen.totalUsd)}`} />
          </>
        )
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Comportamiento', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Comportamiento de Clientes', `Al ${fmtDate(data?.asOf)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay clientes con compras registradas."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Última compra</TableCell>
              <TableCell align="right">Tickets</TableCell>
              <TableCell align="right">Total USD</TableCell>
              <TableCell>Categoría top</TableCell>
              <TableCell>Segmento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="body2" noWrap title={r.customerName}>{r.customerName}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>{r.document}</Typography>
                </TableCell>
                <TableCell>{fmtDate(r.lastPurchase)}</TableCell>
                <TableCell align="right">{r.tickets}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.totalUsd)}</TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{r.topCategory ?? '—'}</Typography></TableCell>
                <TableCell><Chip size="small" variant="outlined" color={SEGMENT[r.segment]?.color} label={SEGMENT[r.segment]?.label ?? r.segment} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
