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
import { fmtUsd, fmtDate, downloadCsv, docKindLabel } from '../../model/format';

export function LibroVentasView({ period, branchId }: { period: LibroPeriod; branchId?: string }) {
  const { data, isLoading, isError, error } = useLibroVentas(period.year, period.month, branchId);

  const handleExport = () => {
    if (!data) return;
    const headers = [
      'Fecha',
      'Tipo',
      'Documento',
      'Nº Control',
      'RIF',
      'Cliente',
      'Exentas USD',
      'Base 16% USD',
      'IVA USD',
      'Total USD',
      'Total Bs',
      'Tasa',
    ];
    const rows = data.rows.map((r) => [
      fmtDate(r.date),
      docKindLabel(r.documentKind),
      r.documentNumber,
      r.controlNumber ?? '',
      r.customerRif ?? '',
      r.customerName,
      fmtUsd(r.exemptUsd),
      fmtUsd(r.taxableBaseUsd),
      fmtUsd(r.vatUsd),
      fmtUsd(r.totalUsd),
      fmtUsd(r.totalBs),
      r.exchangeRate,
    ]);
    downloadCsv(`libro-ventas-${period.year}-${String(period.month).padStart(2, '0')}.csv`, headers, rows);
  };

  if (isLoading) return <LinearProgress />;
  if (isError) return <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>;
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Período <strong>{data.period.label}</strong> · {data.resumen.totalOperations} operaciones
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

      {/* Breakdown SENIAT */}
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
        <Chip
          size="small"
          variant="outlined"
          label={`Máquina fiscal: USD ${fmtUsd(data.breakdown.byFiscalMachineUsd)}`}
        />
        <Chip
          size="small"
          variant="outlined"
          label={`Medios electrónicos: USD ${fmtUsd(data.breakdown.byElectronicMeansUsd)}`}
        />
        <Chip
          size="small"
          variant="outlined"
          color="info"
          label={`Contribuyentes: USD ${fmtUsd(data.breakdown.contribuyentesUsd)}`}
        />
        <Chip
          size="small"
          variant="outlined"
          label={`No contribuyentes: USD ${fmtUsd(data.breakdown.noContribuyentesUsd)}`}
        />
      </Stack>

      {data.breakdown.byElectronicMeansUsd > 0 && data.breakdown.byFiscalMachineUsd === 0 && (
        <Alert severity="warning" variant="outlined">
          Todas las ventas son por medios electrónicos (sin máquina fiscal). El libro será
          totalmente conforme cuando la impresora fiscal HKA esté operativa y los tickets tengan
          número de control fiscal.
        </Alert>
      )}

      {data.rows.length === 0 ? (
        <Alert severity="info">No hay ventas registradas en este período.</Alert>
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
                  <TableCell align="right">Exentas</TableCell>
                  <TableCell align="right">Base 16%</TableCell>
                  <TableCell align="right">IVA</TableCell>
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
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={r.customerName}>
                        {r.customerName}
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
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell colSpan={5}>RESUMEN DEL PERÍODO</TableCell>
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
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        </Card>
      )}
    </Stack>
  );
}
