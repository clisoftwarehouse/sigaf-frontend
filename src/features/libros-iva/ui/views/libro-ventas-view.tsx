import type { LibroPeriod } from '../../model/types';

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

import { useLibroVentas } from '../../api/libros-iva.queries';
import { fmtBs, fmtUsd, fmtDate, fmtRate, exportPdf, exportXlsx, docKindLabel } from '../../model/format';

export function LibroVentasView({ period, branchId }: { period: LibroPeriod; branchId?: string }) {
  const { data, isLoading, isError, error } = useLibroVentas(period.year, period.month, branchId);

  const fileBase = `libro-ventas-${period.year}-${String(period.month).padStart(2, '0')}`;
  const headers = [
    'Fecha',
    'Tipo',
    'Documento',
    'Nº Control',
    'RIF',
    'Cliente',
    'Tasa BCV',
    'Exentas Bs',
    'Base 16% Bs',
    'IVA Bs',
    'Total Bs',
    'Total USD (ref)',
  ];

  const buildRows = (): (string | number)[][] => {
    if (!data) return [];
    return data.rows.map((r) => [
      fmtDate(r.date),
      docKindLabel(r.documentKind),
      r.documentNumber,
      r.controlNumber ?? '',
      r.customerRif ?? 'CF',
      r.customerName,
      fmtRate(r.exchangeRate),
      fmtBs(r.exemptBs),
      fmtBs(r.taxableBaseBs),
      fmtBs(r.vatBs),
      fmtBs(r.totalBs),
      fmtUsd(r.totalUsd),
    ]);
  };

  const footerRow = (): (string | number)[] => {
    if (!data) return [];
    return [
      'RESUMEN',
      '',
      '',
      '',
      '',
      `${data.resumen.totalOperations} ops`,
      '',
      fmtBs(data.resumen.totalExemptBs),
      fmtBs(data.resumen.totalTaxableBaseBs),
      fmtBs(data.resumen.totalVatBs),
      fmtBs(data.resumen.totalBs),
      fmtUsd(data.resumen.totalUsd),
    ];
  };

  const handleExcel = () => exportXlsx(`${fileBase}.xlsx`, 'Libro Ventas', headers, [...buildRows(), footerRow()]);
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      'Libro de Ventas — IVA',
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
          Período <strong>{data.period.label}</strong> · {data.resumen.totalOperations} operaciones ·
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

      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
        <Chip size="small" variant="outlined" color="info" label={`Contribuyentes: USD ${fmtUsd(data.breakdown.contribuyentesUsd)}`} />
        <Chip size="small" variant="outlined" label={`No contribuyentes: USD ${fmtUsd(data.breakdown.noContribuyentesUsd)}`} />
      </Stack>

      {data.rows.length === 0 ? (
        <Alert severity="info">
          No hay ventas con factura fiscal en este período. El libro registra únicamente las ventas
          facturadas con la máquina fiscal.
        </Alert>
      ) : (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>RIF</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right">Tasa</TableCell>
                  <TableCell align="right">Exentas Bs</TableCell>
                  <TableCell align="right">Base 16% Bs</TableCell>
                  <TableCell align="right">IVA Bs</TableCell>
                  <TableCell align="right">Total Bs</TableCell>
                  <TableCell align="right">Total USD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((r, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={r.documentKind === 'credit_note' ? 'error' : 'default'}
                        label={docKindLabel(r.documentKind)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.documentNumber}
                      {r.controlNumber && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          Ctrl {r.controlNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.customerRif ?? 'CF'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" noWrap title={r.customerName}>
                        {r.customerName}
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
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell colSpan={6}>RESUMEN DEL PERÍODO</TableCell>
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
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        </Card>
      )}
    </Stack>
  );
}
