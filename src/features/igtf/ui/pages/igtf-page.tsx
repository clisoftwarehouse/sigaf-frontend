import type { IgtfPeriod } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableFooter from '@mui/material/TableFooter';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { useIgtfPercepcion } from '../../api/igtf.queries';
import { PeriodSelector } from '../../../libros-iva/ui/components/period-selector';
import { fmtBs, fmtUsd, fmtDate, fmtRate, exportPdf, exportXlsx } from '../../../libros-iva/model/format';

export default function IgtfPage() {
  const now = new Date();
  const [period, setPeriod] = useState<IgtfPeriod>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const { data, isLoading, isError, error } = useIgtfPercepcion(period.year, period.month);

  const fileBase = `igtf-percepcion-${period.year}-${String(period.month).padStart(2, '0')}`;
  const headers = [
    'Fecha',
    'Documento',
    'Nº Control',
    'RIF',
    'Cliente',
    'Tasa BCV',
    'Base divisas Bs',
    'IGTF 3% Bs',
    'Base divisas USD',
    'IGTF 3% USD',
  ];

  const buildRows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      fmtDate(r.date),
      r.documentNumber,
      r.controlNumber ?? '',
      r.customerRif ?? 'CF',
      r.customerName,
      fmtRate(r.exchangeRate),
      fmtBs(r.baseBs),
      fmtBs(r.igtfBs),
      fmtUsd(r.baseUsd),
      fmtUsd(r.igtfUsd),
    ]);

  const footerRow = (): (string | number)[] => {
    if (!data) return [];
    return [
      'RESUMEN',
      '',
      '',
      '',
      `${data.resumen.totalOperations} ops`,
      '',
      fmtBs(data.resumen.totalBaseBs),
      fmtBs(data.resumen.totalIgtfBs),
      fmtUsd(data.resumen.totalBaseUsd),
      fmtUsd(data.resumen.totalIgtfUsd),
    ];
  };

  const handleExcel = () => exportXlsx(`${fileBase}.xlsx`, 'IGTF Percepcion', headers, [...buildRows(), footerRow()]);
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      'Percepción del IGTF (3%)',
      `Período ${data?.period.label ?? ''} · Montos en Bolívares (Bs.)`,
      headers,
      buildRows(),
      footerRow(),
    );

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Percepción del IGTF"
        subtitle="IGTF del 3% percibido en pagos en divisas. Solo ventas con factura fiscal (agente de percepción SENIAT)."
        crumbs={[{ label: 'Administración' }, { label: 'Percepción del IGTF' }]}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="flex-end"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </Stack>

      {isLoading ? (
        <LinearProgress />
      ) : isError ? (
        <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>
      ) : !data ? null : (
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Período <strong>{data.period.label}</strong> · {data.resumen.totalOperations} operaciones con IGTF ·
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
            <Chip
              size="small"
              variant="outlined"
              color="warning"
              label={`IGTF percibido: Bs ${fmtBs(data.resumen.totalIgtfBs)}`}
            />
            <Chip size="small" variant="outlined" label={`Base en divisas: Bs ${fmtBs(data.resumen.totalBaseBs)}`} />
          </Stack>

          {data.rows.length === 0 ? (
            <Alert severity="info">
              No hay percepción de IGTF en este período. Solo se registran las ventas con factura fiscal pagadas en
              divisas.
            </Alert>
          ) : (
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>RIF</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Tasa</TableCell>
                      <TableCell align="right">Base divisas Bs</TableCell>
                      <TableCell align="right">IGTF 3% Bs</TableCell>
                      <TableCell align="right">IGTF USD</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map((r, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{fmtDate(r.date)}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {r.documentNumber}
                          {r.controlNumber && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                              Ctrl {r.controlNumber}
                            </Typography>
                          )}
                          {r.isReturn && (
                            <Chip size="small" variant="outlined" color="error" label="Devolución" sx={{ mt: 0.5 }} />
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
                          {fmtBs(r.baseBs)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {fmtBs(r.igtfBs)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                          {fmtUsd(r.igtfUsd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                      <TableCell colSpan={4}>RESUMEN DEL PERÍODO</TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtBs(data.resumen.totalBaseBs)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtBs(data.resumen.totalIgtfBs)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                        {fmtUsd(data.resumen.totalIgtfUsd)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Box>
            </Card>
          )}
        </Stack>
      )}
    </Container>
  );
}
