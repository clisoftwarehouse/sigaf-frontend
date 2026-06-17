import type { RentabilidadGroupBy } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableFooter from '@mui/material/TableFooter';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { useRentabilidad } from '../../api/rentabilidad.queries';
import { fmtUsd, fmtDate, exportPdf, exportXlsx } from '../../../libros-iva/model/format';

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const fmtQty = (n: number): string => (Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 3 });
const fmtPct = (n: number): string => `${(Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}%`;

export default function RentabilidadPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState<RentabilidadGroupBy>('product');

  const { data, isLoading, isError, error } = useRentabilidad({ from, to, groupBy });

  const fileBase = `rentabilidad-${groupBy}-${from}_${to}`;
  const colLabel = groupBy === 'category' ? 'Categoría' : 'Producto';
  const headers = [colLabel, 'Cant.', 'Ingreso USD', 'Costo USD', 'Margen USD', 'Margen %'];

  const buildRows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.reference ? `${r.name} (${r.reference})` : r.name,
      fmtQty(r.quantitySold),
      fmtUsd(r.revenueUsd),
      fmtUsd(r.cogsUsd),
      fmtUsd(r.marginUsd),
      fmtPct(r.marginPct),
    ]);

  const footerRow = (): (string | number)[] => {
    if (!data) return [];
    return [
      'TOTAL',
      fmtQty(data.resumen.totalQuantity),
      fmtUsd(data.resumen.totalRevenueUsd),
      fmtUsd(data.resumen.totalCogsUsd),
      fmtUsd(data.resumen.totalMarginUsd),
      fmtPct(data.resumen.marginPct),
    ];
  };

  const handleExcel = () => exportXlsx(`${fileBase}.xlsx`, 'Rentabilidad', headers, [...buildRows(), footerRow()]);
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      `Rentabilidad por ${colLabel.toLowerCase()}`,
      `${fmtDate(from)} — ${fmtDate(to)} · Montos en USD · Sobre todas las ventas`,
      headers,
      buildRows(),
      footerRow(),
    );

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Rentabilidad"
        subtitle="Margen bruto (ingreso − costo) por producto o categoría. Sobre todas las ventas físicas. Montos en USD."
        crumbs={[{ label: 'Administración' }, { label: 'Rentabilidad' }]}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="flex-end"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <TextField
          select
          size="small"
          label="Agrupar por"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as RentabilidadGroupBy)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="product">Producto</MenuItem>
          <MenuItem value="category">Categoría</MenuItem>
        </TextField>
        <TextField
          type="date"
          size="small"
          label="Desde"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="date"
          size="small"
          label="Hasta"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
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
                color="success"
                label={`Margen: USD ${fmtUsd(data.resumen.totalMarginUsd)} (${fmtPct(data.resumen.marginPct)})`}
              />
              <Chip size="small" variant="outlined" label={`Ingreso: USD ${fmtUsd(data.resumen.totalRevenueUsd)}`} />
              <Chip size="small" variant="outlined" label={`Costo: USD ${fmtUsd(data.resumen.totalCogsUsd)}`} />
            </Stack>
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

          {data.rows.length === 0 ? (
            <Alert severity="info">No hay ventas en el rango seleccionado.</Alert>
          ) : (
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{colLabel}</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Ingreso USD</TableCell>
                      <TableCell align="right">Costo USD</TableCell>
                      <TableCell align="right">Margen USD</TableCell>
                      <TableCell align="right">Margen %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map((r) => (
                      <TableRow key={r.key} hover>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" noWrap title={r.name}>
                            {r.name}
                          </Typography>
                          {r.reference && (
                            <Typography variant="caption" color="text.disabled">
                              {r.reference}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {fmtQty(r.quantitySold)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {fmtUsd(r.revenueUsd)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                          {fmtUsd(r.cogsUsd)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontFamily: 'monospace', fontWeight: 700, color: r.marginUsd < 0 ? 'error.main' : 'inherit' }}
                        >
                          {fmtUsd(r.marginUsd)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontFamily: 'monospace', color: r.marginPct < 0 ? 'error.main' : 'success.main' }}
                        >
                          {fmtPct(r.marginPct)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                      <TableCell>TOTAL ({data.resumen.lines})</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtQty(data.resumen.totalQuantity)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtUsd(data.resumen.totalRevenueUsd)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtUsd(data.resumen.totalCogsUsd)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtUsd(data.resumen.totalMarginUsd)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtPct(data.resumen.marginPct)}
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
