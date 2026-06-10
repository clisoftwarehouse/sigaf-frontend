import type { LibroPeriod } from '../../model/types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableFooter from '@mui/material/TableFooter';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';

import { useLibroCompras } from '../../api/libros-iva.queries';
import { fmtBs, fmtUsd, fmtDate, fmtRate, exportPdf, exportXlsx } from '../../model/format';

export function LibroComprasView({ period, branchId }: { period: LibroPeriod; branchId?: string }) {
  const { data, isLoading, isError, error } = useLibroCompras(period.year, period.month, branchId);

  const fileBase = `libro-compras-${period.year}-${String(period.month).padStart(2, '0')}`;
  const headers = [
    'Fecha',
    'Factura',
    'Nº Control',
    'RIF Proveedor',
    'Proveedor',
    'Tasa BCV',
    'Exentas Bs',
    'Base 16% Bs',
    'IVA Crédito Bs',
    'Total Bs',
    'Total USD (ref)',
    'Genera Crédito',
  ];

  const buildRows = (): (string | number)[][] => {
    if (!data) return [];
    return data.rows.map((r) => [
      fmtDate(r.date),
      r.documentNumber ?? '',
      r.controlNumber ?? '',
      r.supplierRif,
      r.supplierName,
      fmtRate(r.exchangeRate),
      fmtBs(r.exemptBs),
      fmtBs(r.taxableBaseBs),
      fmtBs(r.vatBs),
      fmtBs(r.totalBs),
      fmtUsd(r.totalUsd),
      r.generatesCredit ? 'Sí' : `No (${r.complianceWarnings.join('; ')})`,
    ]);
  };

  const footerRow = (): (string | number)[] => {
    if (!data) return [];
    return [
      'RESUMEN',
      '',
      '',
      '',
      `${data.resumen.totalOperations} facturas`,
      '',
      fmtBs(data.resumen.totalExemptBs),
      fmtBs(data.resumen.totalTaxableBaseBs),
      fmtBs(data.resumen.totalVatBs),
      fmtBs(data.resumen.totalBs),
      fmtUsd(data.resumen.totalUsd),
      '',
    ];
  };

  const handleExcel = () => exportXlsx(`${fileBase}.xlsx`, 'Libro Compras', headers, [...buildRows(), footerRow()]);
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      'Libro de Compras — IVA',
      `Período ${data?.period.label ?? ''} · Montos en Bolívares (Bs.)`,
      headers,
      buildRows(),
      footerRow(),
    );

  if (isLoading) return <LinearProgress />;
  if (isError) return <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>;
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Período <strong>{data.period.label}</strong> · {data.resumen.totalOperations} facturas ·
          montos en <strong>Bolívares</strong>
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:file-text-bold" />}
            onClick={handleExcel}
            disabled={data.rows.length === 0}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:file-corrupted-bold-duotone" />}
            onClick={handlePdf}
            disabled={data.rows.length === 0}
          >
            PDF
          </Button>
        </Stack>
      </Stack>

      {data.nonDeductibleVatUsd > 0 && (
        <Alert severity="warning" variant="outlined">
          <strong>USD {fmtUsd(data.nonDeductibleVatUsd)}</strong> de IVA NO genera crédito fiscal por
          facturas que incumplen el Art. 57 LIVA (falta número de control, RIF o desglose). Revisá
          las filas marcadas en rojo.
        </Alert>
      )}

      {data.rows.length === 0 ? (
        <Alert severity="info">No hay compras registradas en este período.</Alert>
      ) : (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Factura</TableCell>
                  <TableCell>RIF</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="right">Tasa</TableCell>
                  <TableCell align="right">Exentas Bs</TableCell>
                  <TableCell align="right">Base 16% Bs</TableCell>
                  <TableCell align="right">IVA Bs</TableCell>
                  <TableCell align="right">Total Bs</TableCell>
                  <TableCell align="right">Total USD</TableCell>
                  <TableCell align="center">Créd.</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((r, idx) => (
                  <TableRow key={idx} hover sx={{ bgcolor: r.generatesCredit ? undefined : 'error.lighter' }}>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.documentNumber ?? '—'}
                      {r.controlNumber && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          Ctrl {r.controlNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.supplierRif}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" noWrap title={r.supplierName}>
                        {r.supplierName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {fmtRate(r.exchangeRate)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.exemptBs)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.taxableBaseBs)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtBs(r.vatBs)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {fmtBs(r.totalBs)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                      {fmtUsd(r.totalUsd)}
                    </TableCell>
                    <TableCell align="center">
                      {r.generatesCredit ? (
                        <Iconify icon="solar:check-circle-bold" sx={{ color: 'success.main' }} />
                      ) : (
                        <Tooltip title={r.complianceWarnings.join(' · ')}>
                          <Box component="span" sx={{ display: 'inline-flex' }}>
                            <Iconify icon="solar:danger-triangle-bold" sx={{ color: 'error.main' }} />
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell colSpan={5}>RESUMEN DEL PERÍODO</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtBs(data.resumen.totalExemptBs)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtBs(data.resumen.totalTaxableBaseBs)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtBs(data.resumen.totalVatBs)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtBs(data.resumen.totalBs)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                    {fmtUsd(data.resumen.totalUsd)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        </Card>
      )}
    </Stack>
  );
}
