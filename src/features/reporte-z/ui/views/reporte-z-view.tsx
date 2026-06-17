import type { LibroPeriod } from '@/features/libros-iva/model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableFooter from '@mui/material/TableFooter';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useLibroVentas } from '@/features/libros-iva/api/libros-iva.queries';
import { fmtBs, fmtDate, exportPdf, exportXlsx } from '@/features/libros-iva/model/format';

import { useReporteZ } from '../../api/reporte-z.queries';

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function monthRange(period: LibroPeriod): { from: string; to: string } {
  const from = new Date(Date.UTC(period.year, period.month - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(period.year, period.month, 0, 23, 59, 59));
  return { from: from.toISOString(), to: to.toISOString() };
}

export function ReporteZView({ period, branchId }: { period: LibroPeriod; branchId?: string }) {
  const { from, to } = useMemo(() => monthRange(period), [period]);
  const { data: rows = [], isLoading, isError, error } = useReporteZ(from, to, branchId);
  const { data: libro } = useLibroVentas(period.year, period.month, branchId);
  const { data: branchOpts = [] } = useBranchOptions();

  const branchName = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  // Cross-check: suma de ventas netas de los Z vs total fiscal del Libro de
  // Ventas (mismo período, ambos en Bs y ambos solo-fiscal). Si no cuadran,
  // alerta — significa ventas fiscalizadas que no llegaron al backend o
  // viceversa.
  const zNetTotal = useMemo(() => rows.reduce((s, r) => s + num(r.totalSalesNet), 0), [rows]);
  const libroTotal = libro ? num(libro.resumen.totalBs) : null;
  const diff = libroTotal != null ? zNetTotal - libroTotal : null;
  const cuadra = diff != null && Math.abs(diff) <= Math.max(1, libroTotal! * 0.005);

  const fileBase = `reporte-z-${period.year}-${String(period.month).padStart(2, '0')}`;
  const headers = [
    'Fecha',
    'Sucursal',
    'Nº Z',
    'Serial',
    'Exento Bs',
    'Base 16% Bs',
    'IVA Bs',
    'Devoluciones Bs',
    'Ventas netas Bs',
  ];
  const buildRows = (): (string | number)[][] =>
    rows.map((r) => [
      fmtDate(r.createdAt),
      r.branchId ? (branchName.get(r.branchId) ?? r.branchId) : '—',
      r.zNumber,
      r.machineSerial,
      fmtBs(r.exemptSales),
      fmtBs(r.generalRate1Sale),
      fmtBs(r.totalTax),
      fmtBs(r.totalDevolution),
      fmtBs(r.totalSalesNet),
    ]);

  const handleExcel = () => exportXlsx(`${fileBase}.xlsx`, 'Reporte Z', headers, buildRows());
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      'Reporte Z — Cierres fiscales',
      `Período ${period.month}/${period.year} · Montos en Bolívares (Bs.)`,
      headers,
      buildRows()
    );

  if (isLoading) return <LinearProgress />;
  if (isError) return <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          {rows.length} cierre(s) Z en el período · montos en <strong>Bolívares</strong>
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:file-text-bold" />}
            onClick={handleExcel}
            disabled={rows.length === 0}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:file-corrupted-bold-duotone" />}
            onClick={handlePdf}
            disabled={rows.length === 0}
          >
            PDF
          </Button>
        </Stack>
      </Stack>

      {/* Cross-check vs Libro de Ventas */}
      {libroTotal != null && rows.length > 0 && (
        <Alert severity={cuadra ? 'success' : 'warning'} variant="outlined">
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {cuadra ? 'Cuadra con el Libro de Ventas' : 'No cuadra con el Libro de Ventas'}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, fontSize: 13 }}>
            <li>Ventas netas (cierres Z): Bs {fmtBs(zNetTotal)}</li>
            <li>Ventas fiscales (Libro de Ventas): Bs {fmtBs(libroTotal)}</li>
            <li>Diferencia: Bs {fmtBs(diff ?? 0)}</li>
          </Box>
        </Alert>
      )}

      {rows.length === 0 ? (
        <Alert severity="info">No hay cierres Z registrados en este período.</Alert>
      ) : (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell>Nº Z</TableCell>
                  <TableCell>Serial</TableCell>
                  <TableCell align="right">Exento Bs</TableCell>
                  <TableCell align="right">Base 16% Bs</TableCell>
                  <TableCell align="right">IVA Bs</TableCell>
                  <TableCell align="right">Devol. Bs</TableCell>
                  <TableCell align="right">Ventas netas Bs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{fmtDate(r.createdAt)}</TableCell>
                    <TableCell>
                      {r.branchId ? (branchName.get(r.branchId) ?? r.branchId) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="soft" color="info" label={r.zNumber} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.machineSerial}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.exemptSales)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.generalRate1Sale)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.totalTax)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.totalDevolution)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {fmtBs(r.totalSalesNet)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell colSpan={8}>TOTAL VENTAS NETAS</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtBs(zNetTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        </Card>
      )}
    </Stack>
  );
}
