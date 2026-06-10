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
import { fmtUsd, fmtDate, downloadCsv } from '../../model/format';

export function LibroComprasView({ period, branchId }: { period: LibroPeriod; branchId?: string }) {
  const { data, isLoading, isError, error } = useLibroCompras(period.year, period.month, branchId);

  const handleExport = () => {
    if (!data) return;
    const headers = [
      'Fecha',
      'Factura',
      'Nº Control',
      'RIF Proveedor',
      'Proveedor',
      'Exentas USD',
      'Base 16% USD',
      'IVA (Crédito) USD',
      'Total USD',
      'Total Bs',
      'Genera Crédito',
    ];
    const rows = data.rows.map((r) => [
      fmtDate(r.date),
      r.documentNumber ?? '',
      r.controlNumber ?? '',
      r.supplierRif,
      r.supplierName,
      fmtUsd(r.exemptUsd),
      fmtUsd(r.taxableBaseUsd),
      fmtUsd(r.vatUsd),
      fmtUsd(r.totalUsd),
      fmtUsd(r.totalBs),
      r.generatesCredit ? 'Sí' : `No (${r.complianceWarnings.join('; ')})`,
    ]);
    downloadCsv(`libro-compras-${period.year}-${String(period.month).padStart(2, '0')}.csv`, headers, rows);
  };

  if (isLoading) return <LinearProgress />;
  if (isError) return <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>;
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Período <strong>{data.period.label}</strong> · {data.resumen.totalOperations} facturas
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Iconify icon="solar:export-bold" />}
          onClick={handleExport}
          disabled={data.rows.length === 0}
        >
          Exportar CSV
        </Button>
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
                  <TableCell align="right">Exentas</TableCell>
                  <TableCell align="right">Base 16%</TableCell>
                  <TableCell align="right">IVA Crédito</TableCell>
                  <TableCell align="right">Total USD</TableCell>
                  <TableCell align="center">Crédito</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((r, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{ bgcolor: r.generatesCredit ? undefined : 'error.lighter' }}
                  >
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
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={r.supplierName}>
                        {r.supplierName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtUsd(r.exemptUsd)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtUsd(r.taxableBaseUsd)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtUsd(r.vatUsd)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
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
                  <TableCell colSpan={4}>RESUMEN DEL PERÍODO</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtUsd(data.resumen.totalExemptUsd)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtUsd(data.resumen.totalTaxableBaseUsd)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtUsd(data.resumen.totalVatUsd)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
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
