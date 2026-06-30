import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { useFlujoCaja } from '../../api/crm-finance-reports.queries';
import { ReportLayout } from '../../../inventory-reports/ui/components/report-layout';
import { fmtBs, fmtDate, exportPdf, exportXlsx } from '../../../inventory-reports/model/helpers';

export default function FlujoCajaPage() {
  const { selectedBranchId } = useBranchScope();
  const [weeks, setWeeks] = useState(8);
  const { data, isLoading, isError, error } = useFlujoCaja({ weeks, branchId: selectedBranchId ?? undefined });

  const headers = ['Semana', 'Ingreso proyectado USD', 'CxP por vencer USD', 'Neto USD', 'Acumulado USD'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      `${fmtDate(r.weekStart)} — ${fmtDate(r.weekEnd)}`,
      fmtBs(r.projectedIncomeUsd),
      fmtBs(r.payablesDueUsd),
      fmtBs(r.netUsd),
      fmtBs(r.cumulativeUsd),
    ]);

  const file = `flujo-caja-${data?.asOf ?? ''}`;
  return (
    <ReportLayout
      title="Flujo de Caja Proyectado"
      subtitle="Ingresos estimados (según promedio de ventas) vs cuentas por pagar por vencer."
      crumbs={[{ label: 'Reportes' }, { label: 'Flujo de caja' }]}
      summary={
        data && (
          <>
            <Chip size="small" variant="outlined" label={`Venta diaria prom.: USD ${fmtBs(data.avgDailySalesUsd)}`} />
            <Chip size="small" color={data.resumen.netUsd >= 0 ? 'success' : 'error'} variant="outlined" label={`Neto ${data.weeks} sem: USD ${fmtBs(data.resumen.netUsd)}`} />
          </>
        )
      }
      filters={
        <TextField
          type="number"
          size="small"
          label="Semanas"
          value={weeks}
          onChange={(e) => setWeeks(Math.max(1, Number(e.target.value) || 8))}
          sx={{ width: 120 }}
        />
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Flujo caja', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Flujo de Caja Proyectado', `${data?.weeks ?? ''} semanas · al ${fmtDate(data?.asOf)}`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="Sin datos para proyectar."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Semana</TableCell>
              <TableCell align="right">Ingreso proyectado</TableCell>
              <TableCell align="right">CxP por vencer</TableCell>
              <TableCell align="right">Neto</TableCell>
              <TableCell align="right">Acumulado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{fmtDate(r.weekStart)} — {fmtDate(r.weekEnd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'success.main' }}>{fmtBs(r.projectedIncomeUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'error.main' }}>{fmtBs(r.payablesDueUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700, color: r.netUsd < 0 ? 'error.main' : 'inherit' }}>{fmtBs(r.netUsd)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: r.cumulativeUsd < 0 ? 'error.main' : 'inherit' }}>{fmtBs(r.cumulativeUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
