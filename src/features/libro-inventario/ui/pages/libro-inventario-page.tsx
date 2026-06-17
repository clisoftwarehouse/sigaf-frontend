import type { LibroInventarioGroupBy } from '../../model/types';

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
import { fmtBs, fmtUsd, fmtDate, exportPdf, exportXlsx } from '../../../libros-iva/model/format';

const fmtQty = (n: number): string => (Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 3 });

export default function LibroInventarioPage() {
  const [groupBy, setGroupBy] = useState<LibroInventarioGroupBy>('product');

  const { data, isLoading, isError, error } = useLibroInventario({ groupBy });

  const colLabel = groupBy === 'category' ? 'Categoría' : 'Producto';
  const fileBase = `libro-inventario-${groupBy}-${data?.asOf ?? ''}`;
  const headers = [colLabel, 'Cantidad', 'Costo unit. USD', 'Valor USD', 'Valor Bs'];

  const buildRows = (): (string | number)[][] =>
    (data?.rows ?? []).map((r) => [
      r.reference ? `${r.name} (${r.reference})` : r.name,
      fmtQty(r.quantity),
      fmtUsd(r.unitCostUsd),
      fmtUsd(r.valueUsd),
      fmtBs(r.valueBs),
    ]);

  const footerRow = (): (string | number)[] => {
    if (!data) return [];
    return [
      'TOTAL',
      fmtQty(data.resumen.totalQuantity),
      '',
      fmtUsd(data.resumen.totalValueUsd),
      fmtBs(data.resumen.totalValueBs),
    ];
  };

  const handleExcel = () => exportXlsx(`${fileBase}.xlsx`, 'Inventario', headers, [...buildRows(), footerRow()]);
  const handlePdf = () =>
    exportPdf(
      `${fileBase}.pdf`,
      'Libro de Inventario (Art. 177 ISLR)',
      `Existencias al ${fmtDate(data?.asOf)} · Valuadas al costo${data?.bcvRate ? ` · BCV ${data.bcvRate}` : ''}`,
      headers,
      buildRows(),
      footerRow(),
    );

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Libro de Inventario"
        subtitle="Valuación de existencias en mano al costo (Art. 177 ISLR). Foto actual del inventario, en USD y Bs."
        crumbs={[{ label: 'Administración' }, { label: 'Libro de Inventario' }]}
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
          onChange={(e) => setGroupBy(e.target.value as LibroInventarioGroupBy)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="product">Producto</MenuItem>
          <MenuItem value="category">Categoría</MenuItem>
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
              <Chip
                size="small"
                variant="outlined"
                color="success"
                label={`Valor total: USD ${fmtUsd(data.resumen.totalValueUsd)}`}
              />
              <Chip size="small" variant="outlined" label={`Bs ${fmtBs(data.resumen.totalValueBs)}`} />
              {!data.bcvRate && (
                <Chip size="small" variant="outlined" color="warning" label="Sin tasa BCV — solo USD" />
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
            <Alert severity="info">No hay existencias en inventario.</Alert>
          ) : (
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{colLabel}</TableCell>
                      {groupBy === 'product' && <TableCell>Categoría</TableCell>}
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Costo unit. USD</TableCell>
                      <TableCell align="right">Valor USD</TableCell>
                      <TableCell align="right">Valor Bs</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.rows.map((r) => (
                      <TableRow key={r.key} hover>
                        <TableCell sx={{ maxWidth: 280 }}>
                          <Typography variant="body2" noWrap title={r.name}>
                            {r.name}
                          </Typography>
                          {r.reference && (
                            <Typography variant="caption" color="text.disabled">
                              {r.reference}
                            </Typography>
                          )}
                        </TableCell>
                        {groupBy === 'product' && (
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {r.category ?? '—'}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {fmtQty(r.quantity)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                          {fmtUsd(r.unitCostUsd)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {fmtUsd(r.valueUsd)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                          {fmtBs(r.valueBs)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                      <TableCell colSpan={groupBy === 'product' ? 2 : 1}>TOTAL ({data.resumen.lines})</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtQty(data.resumen.totalQuantity)}
                      </TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtUsd(data.resumen.totalValueUsd)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtBs(data.resumen.totalValueBs)}
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
