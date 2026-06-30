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

import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { ReportLayout } from '../components/report-layout';
import { useRiesgo } from '../../api/inventory-reports.queries';
import { fmtBs, fmtQty, fmtDate, exportPdf, exportXlsx } from '../../model/helpers';

const STATUS_COLOR = { vencido: 'error', critico: 'warning', proximo: 'default' } as const;
const STATUS_LABEL = { vencido: 'Vencido', critico: 'Crítico', proximo: 'Próximo' } as const;

export default function RiesgoPage() {
  const { selectedBranchId } = useBranchScope();
  const [horizonDays, setHorizonDays] = useState(90);
  const { data, isLoading, isError, error } = useRiesgo({ horizonDays, branchId: selectedBranchId ?? undefined });

  const headers = ['Producto', 'Código', 'Proveedor', 'Lote', 'Vence', 'Días', 'Cantidad', 'Costo comprometido USD', 'Estado'];
  const rows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.productName,
      r.productCode ?? '',
      r.supplierName ?? '',
      r.lotNumber,
      fmtDate(r.expirationDate),
      r.daysToExpiry,
      fmtQty(r.quantity),
      fmtBs(r.costCommittedUsd),
      STATUS_LABEL[r.status],
    ]);

  const file = `riesgo-vencimiento-${data?.asOf ?? ''}`;
  return (
    <ReportLayout
      title="Riesgo de Vencimiento"
      subtitle="Lotes próximos a vencer o vencidos, con el costo comprometido."
      crumbs={[{ label: 'Reportes' }, { label: 'Riesgo de vencimiento' }]}
      summary={
        data && (
          <>
            <Chip size="small" color="error" variant="outlined" label={`Vencidos: ${data.resumen.expiredCount} · USD ${fmtBs(data.resumen.expiredCostUsd)}`} />
            <Chip size="small" color="warning" variant="outlined" label={`En riesgo: ${data.resumen.atRiskCount} · USD ${fmtBs(data.resumen.atRiskCostUsd)}`} />
          </>
        )
      }
      filters={
        <TextField
          type="number"
          size="small"
          label="Horizonte (días)"
          value={horizonDays}
          onChange={(e) => setHorizonDays(Math.max(1, Number(e.target.value) || 90))}
          sx={{ width: 150 }}
        />
      }
      onExcel={() => exportXlsx(`${file}.xlsx`, 'Riesgo', headers, rows())}
      onPdf={() => exportPdf(`${file}.pdf`, 'Riesgo de Vencimiento', `Existencias al ${fmtDate(data?.asOf)} · Horizonte ${horizonDays} días`, headers, rows())}
      exportDisabled={!data || data.rows.length === 0}
      loading={isLoading}
      error={isError ? error : undefined}
      empty={!!data && data.rows.length === 0}
      emptyMessage="No hay lotes en riesgo de vencimiento."
    >
      <Box sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Lote</TableCell>
              <TableCell>Vence</TableCell>
              <TableCell align="right">Días</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Costo USD</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="body2" noWrap title={r.productName}>
                    {r.productName}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {r.productCode ?? ''} {r.supplierName ? `· ${r.supplierName}` : ''}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{r.lotNumber}</TableCell>
                <TableCell>{fmtDate(r.expirationDate)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', color: r.daysToExpiry < 0 ? 'error.main' : 'inherit' }}>
                  {r.daysToExpiry}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtQty(r.quantity)}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtBs(r.costCommittedUsd)}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" color={STATUS_COLOR[r.status]} label={STATUS_LABEL[r.status]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </ReportLayout>
  );
}
