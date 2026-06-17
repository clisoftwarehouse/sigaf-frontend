import type { ControladosPeriod } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
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

import { useControlados } from '../../api/controlados.queries';
import { fmtDate, exportPdf, exportXlsx } from '../../../libros-iva/model/format';
import { PeriodSelector } from '../../../libros-iva/ui/components/period-selector';

type TabKey = 'dispensaciones' | 'resumen';

const fmtQty = (n: number): string => (Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 3 });

export default function ControladosPage() {
  const now = new Date();
  const [tab, setTab] = useState<TabKey>('dispensaciones');
  const [period, setPeriod] = useState<ControladosPeriod>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const { data, isLoading, isError, error } = useControlados(period.year, period.month);

  const fileBase = `controlados-${tab}-${period.year}-${String(period.month).padStart(2, '0')}`;

  const dispHeaders = ['Fecha', 'Producto', 'Cantidad', 'Paciente', 'C.I. paciente', 'Médico', 'MPPS', 'C.I. médico', 'Récipe', 'Fecha récipe'];
  const dispRows = (): (string | number)[][] =>
    (data?.dispensations ?? []).map((d) => [
      fmtDate(d.date),
      d.productCode ? `${d.productName} (${d.productCode})` : d.productName,
      fmtQty(d.quantity),
      d.patientName,
      d.patientDocument ?? '',
      d.doctorName ?? '',
      d.doctorMpps ?? '',
      d.doctorCedula ?? '',
      d.prescriptionNumber ?? '',
      d.prescriptionDate ? fmtDate(d.prescriptionDate) : '',
    ]);

  const sumHeaders = ['Producto', 'Entradas', 'Salidas', 'Saldo actual'];
  const sumRows = (): (string | number)[][] =>
    (data?.summary ?? []).map((s) => [
      s.productCode ? `${s.productName} (${s.productCode})` : s.productName,
      fmtQty(s.entradas),
      fmtQty(s.salidas),
      fmtQty(s.saldoActual),
    ]);

  const subtitle = `Período ${data?.period.label ?? ''} · Libro de control de psicotrópicos y estupefacientes`;
  const handleExcel = () => {
    if (tab === 'dispensaciones') exportXlsx(`${fileBase}.xlsx`, 'Dispensaciones', dispHeaders, dispRows());
    else exportXlsx(`${fileBase}.xlsx`, 'Resumen', sumHeaders, sumRows());
  };
  const handlePdf = () => {
    if (tab === 'dispensaciones')
      exportPdf(`${fileBase}.pdf`, 'Controlados — Dispensaciones', subtitle, dispHeaders, dispRows());
    else exportPdf(`${fileBase}.pdf`, 'Controlados — Resumen por producto', subtitle, sumHeaders, sumRows());
  };

  const hasRows = tab === 'dispensaciones' ? (data?.dispensations.length ?? 0) > 0 : (data?.summary.length ?? 0) > 0;

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Control de Sustancias (SACS)"
        subtitle="Libro de control de psicotrópicos y estupefacientes. Registro diario de dispensaciones y resumen mensual (Ley de Drogas / Ley de Medicamentos Art. 37)."
        crumbs={[{ label: 'Administración' }, { label: 'Controlados' }]}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="dispensaciones" label="Dispensaciones" />
          <Tab value="resumen" label="Resumen por producto" />
        </Tabs>
        <PeriodSelector value={period} onChange={setPeriod} />
      </Stack>

      {isLoading ? (
        <LinearProgress />
      ) : isError ? (
        <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>
      ) : !data ? null : (
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip
                size="small"
                variant="outlined"
                color="info"
                label={`${data.totals.dispensations} dispensaciones`}
              />
              <Chip size="small" variant="outlined" label={`${data.summary.length} productos controlados`} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:file-text-bold" />}
                onClick={handleExcel}
                disabled={!hasRows}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:file-corrupted-bold-duotone" />}
                onClick={handlePdf}
                disabled={!hasRows}
              >
                PDF
              </Button>
            </Stack>
          </Stack>

          {!hasRows ? (
            <Alert severity="info">
              No hay movimientos de sustancias controladas en este período.
            </Alert>
          ) : tab === 'dispensaciones' ? (
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Médico</TableCell>
                      <TableCell>Récipe</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.dispensations.map((d, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{fmtDate(d.date)}</TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" noWrap title={d.productName}>
                            {d.productName}
                          </Typography>
                          {d.productCode && (
                            <Typography variant="caption" color="text.disabled">
                              {d.productCode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {fmtQty(d.quantity)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {d.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                            {d.patientDocument ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {d.doctorName ?? '—'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            MPPS {d.doctorMpps ?? '—'} · C.I. {d.doctorCedula ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {d.prescriptionNumber ?? '—'}
                          </Typography>
                          {d.prescriptionDate && (
                            <Typography variant="caption" color="text.disabled">
                              {fmtDate(d.prescriptionDate)}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          ) : (
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Entradas</TableCell>
                      <TableCell align="right">Salidas</TableCell>
                      <TableCell align="right">Saldo actual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.summary.map((s) => (
                      <TableRow key={s.productId} hover>
                        <TableCell>
                          <Typography variant="body2">{s.productName}</Typography>
                          {s.productCode && (
                            <Typography variant="caption" color="text.disabled">
                              {s.productCode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'success.main' }}>
                          {fmtQty(s.entradas)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                          {fmtQty(s.salidas)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {fmtQty(s.saldoActual)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                      <TableCell>TOTAL DISPENSADO</TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtQty(data.totals.totalDispensed)}
                      </TableCell>
                      <TableCell />
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
