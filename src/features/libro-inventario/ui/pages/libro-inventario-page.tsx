import type { LibroInventarioRow, LibroInventarioResumen } from '../../model/types';

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

import { useLibroInventario } from '../../api/libro-inventario.queries';
import { fmtBs, exportPdf, exportXlsx } from '../../../libros-iva/model/format';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const SUBHEADERS = [
  'Inicial',
  'Compras E',
  'Compras S',
  'Ventas E',
  'Ventas S',
  'Ajustes E',
  'Ajustes S',
  'Auto C',
  'Final',
  'Anterior',
  'Compras E',
  'Compras S',
  'Ventas E',
  'Ventas S',
  'Ajustes E',
  'Ajustes S',
  'Auto C',
  'Existencia',
];

const EXPORT_HEADERS = [
  'Código',
  'Artículo',
  'Inv. Inicial (U)',
  'Compras Ent. (U)',
  'Compras Sal. (U)',
  'Ventas Ent. (U)',
  'Ventas Sal. (U)',
  'Ajustes Ent. (U)',
  'Ajustes Sal. (U)',
  'Auto Cons. (U)',
  'Inv. Final (U)',
  'Valor Anterior (Bs)',
  'Compras Ent. (Bs)',
  'Compras Sal. (Bs)',
  'Ventas Ent. (Bs)',
  'Ventas Sal. (Bs)',
  'Ajustes Ent. (Bs)',
  'Ajustes Sal. (Bs)',
  'Auto Cons. (Bs)',
  'Valor Existencia (Bs)',
];

const fmtQty = (n: number): string =>
  (Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 3 });

// Las 18 columnas numéricas de una fila (9 unidades + 9 bolívares), en orden.
const numericCells = (r: LibroInventarioRow | LibroInventarioResumen): string[] => [
  fmtQty(r.initialQty),
  fmtQty(r.comprasInQty),
  fmtQty(r.comprasOutQty),
  fmtQty(r.ventasInQty),
  fmtQty(r.ventasOutQty),
  fmtQty(r.ajustesInQty),
  fmtQty(r.ajustesOutQty),
  fmtQty(r.autoConsumoQty),
  fmtQty(r.finalQty),
  fmtBs(r.initialBs),
  fmtBs(r.comprasInBs),
  fmtBs(r.comprasOutBs),
  fmtBs(r.ventasInBs),
  fmtBs(r.ventasOutBs),
  fmtBs(r.ajustesInBs),
  fmtBs(r.ajustesOutBs),
  fmtBs(r.autoConsumoBs),
  fmtBs(r.finalBs),
];

const now = new Date();

export default function LibroInventarioPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, isError, error } = useLibroInventario({ year, month });

  const fileBase = `libro-inventario-${year}-${String(month).padStart(2, '0')}`;

  const buildRows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [r.code ?? '', r.name, ...numericCells(r)]);

  const footerRow = (): (string | number)[] =>
    data ? ['', `TOTAL GENERAL (${data.resumen.lines})`, ...numericCells(data.resumen)] : [];

  const handleExcel = () =>
    exportXlsx(`${fileBase}.xlsx`, 'Libro de Inventario', EXPORT_HEADERS, [...buildRows(), footerRow()]);
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      'Libro de Inventario — Movimiento de Unidades (Art. 177 ISLR)',
      `${data?.period.label ?? ''}${data?.bcvRate ? ` · BCV ${data.bcvRate}` : ''}`,
      EXPORT_HEADERS,
      buildRows(),
      footerRow(),
    );

  return (
    <Container maxWidth={false} sx={{ pb: 6 }}>
      <PageHeader
        title="Libro de Inventario"
        subtitle="Relación mensual de entradas y salidas (Art. 177 ISLR). Solo movimientos fiscales; en unidades y bolívares al costo."
        crumbs={[{ label: 'Obligaciones fiscales' }, { label: 'Libro de Inventario' }]}
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
          label="Mes"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          sx={{ minWidth: 140 }}
        >
          {MONTHS.map((m, i) => (
            <MenuItem key={m} value={i + 1}>
              {m}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Año"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          sx={{ minWidth: 110 }}
        >
          {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading ? (
        <LinearProgress />
      ) : isError ? (
        <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>
      ) : !data ? null : (
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip size="small" variant="outlined" color="info" label={data.period.label} />
              <Chip size="small" variant="outlined" label={`${data.resumen.lines} productos`} />
              {!data.bcvRate && (
                <Chip size="small" variant="outlined" color="warning" label="Sin tasa BCV — Bs en 0" />
              )}
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
            <Alert severity="info">No hay movimientos fiscales de inventario en el período.</Alert>
          ) : (
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2}>Código</TableCell>
                      <TableCell rowSpan={2}>Artículo</TableCell>
                      <TableCell colSpan={9} align="center" sx={{ borderLeft: 1, borderColor: 'divider' }}>
                        UNIDADES
                      </TableCell>
                      <TableCell colSpan={9} align="center" sx={{ borderLeft: 1, borderColor: 'divider' }}>
                        BOLÍVARES (al costo)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      {SUBHEADERS.map((h, i) => (
                        <TableCell
                          key={`${h}-${i}`}
                          align="right"
                          sx={i === 0 || i === 9 ? { borderLeft: 1, borderColor: 'divider' } : undefined}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map((r) => (
                      <TableRow key={`${r.code ?? ''}-${r.name}`} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {r.code ?? '—'}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          <Typography variant="body2" noWrap title={r.name}>
                            {r.name}
                          </Typography>
                        </TableCell>
                        {numericCells(r).map((v, i) => (
                          <TableCell
                            key={i}
                            align="right"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              ...(i === 0 || i === 9 ? { borderLeft: 1, borderColor: 'divider' } : {}),
                              ...(i === 8 || i === 17 ? { fontWeight: 700 } : { color: 'text.secondary' }),
                            }}
                          >
                            {v}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                      <TableCell colSpan={2}>TOTAL GENERAL ({data.resumen.lines})</TableCell>
                      {numericCells(data.resumen).map((v, i) => (
                        <TableCell
                          key={i}
                          align="right"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            ...(i === 0 || i === 9 ? { borderLeft: 1, borderColor: 'divider' } : {}),
                          }}
                        >
                          {v}
                        </TableCell>
                      ))}
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
