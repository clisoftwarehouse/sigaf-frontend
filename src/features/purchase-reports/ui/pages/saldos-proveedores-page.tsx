import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableFooter from '@mui/material/TableFooter';

import { useSaldosProveedores } from '../../api/purchase-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, fmtDate, exportPdf, exportXlsx } from '../../../inventory-reports/model/helpers';

const STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  al_dia: { label: 'Al día', color: 'success' },
  por_vencer: { label: 'Por vencer', color: 'warning' },
  vencida: { label: 'Vencida', color: 'error' },
};

export default function SaldosProveedoresPage() {
  const { data, isLoading, isError, error } = useSaldosProveedores({});

  const headers = ['Proveedor', 'RIF', 'Factura', 'Fecha factura', 'Vence', 'Días crédito', 'Días vencidos', 'Original USD', 'Saldo USD', 'Estatus'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.supplierName,
      r.rif,
      r.invoiceNumber ?? '',
      fmtDate(r.invoiceDate),
      fmtDate(r.dueDate),
      r.creditDays,
      r.daysOverdue,
      fmtBs(r.originalUsd),
      fmtBs(r.balanceUsd),
      STATUS[r.status]?.label ?? r.status,
    ]);

  const file = `saldos-proveedores-${data?.asOf ?? ''}`;
  return (
    <ReportLayout
      title="Saldos a Proveedores"
      subtitle="Cuentas por pagar abiertas con días vencidos y estatus."
      crumbs={[{ label: 'Reportes' }, { label: 'Saldos a proveedores' }]}
      summary={
        data && (
          <>
            <Chip size="small" variant="outlined" label={`Saldo total: USD ${fmtBs(data.resumen.totalBalanceUsd)}`} />
            <Chip size="small" color="error" variant="outlined" label={`Vencido: USD ${fmtBs(data.resumen.overdueUsd)} (${data.resumen.overdueCount})`} />
          </>
        )
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Saldos proveedores', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Saldos a Proveedores', `Al ${fmtDate(data?.asOf)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay cuentas por pagar abiertas."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Proveedor</TableCell>
              <TableCell>Factura</TableCell>
              <TableCell>Vence</TableCell>
              <TableCell align="right">Días vencidos</TableCell>
              <TableCell align="right">Saldo USD</TableCell>
              <TableCell>Estatus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Typography variant="body2" noWrap title={r.supplierName}>{r.supplierName}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>{r.rif}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.invoiceNumber ?? '—'}</TableCell>
                <TableCell>{fmtDate(r.dueDate)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: r.daysOverdue > 0 ? 'error.main' : 'inherit' }}>{r.daysOverdue > 0 ? r.daysOverdue : '—'}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtBs(r.balanceUsd)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={STATUS[r.status]?.color} label={STATUS[r.status]?.label ?? r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
          {data && data.rows.length > 0 && (
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell colSpan={4}>TOTAL POR PAGAR ({data.resumen.count})</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(data.resumen.totalBalanceUsd)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Box>
    </ReportLayout>
  );
}
