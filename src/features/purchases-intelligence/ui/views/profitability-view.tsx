import type { ProfitabilityPeriod, ProfitabilityQuadrant } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fmt, fmtUsd, fmtPct } from '../components/format';
import { useProfitability } from '../../api/intelligence.queries';
import { QuadrantChip, QUADRANT_META } from '../components/quadrant-chip';

// ----------------------------------------------------------------------

const PERIODS: Array<{ value: ProfitabilityPeriod; label: string }> = [
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'semester', label: 'Semestre' },
  { value: 'year', label: 'Año' },
  { value: 'custom', label: 'Rango custom' },
];

export function ProfitabilityView({ branchId }: { branchId: string }) {
  const [period, setPeriod] = useState<ProfitabilityPeriod>('quarter');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [quadrant, setQuadrant] = useState<'' | ProfitabilityQuadrant>('');

  const isCustomReady = period !== 'custom' || Boolean(from);
  const { data, isLoading, isError } = useProfitability({
    period,
    branchId: branchId || undefined,
    quadrant: quadrant || undefined,
    from: period === 'custom' ? from || undefined : undefined,
    to: period === 'custom' ? to || undefined : undefined,
    limit: 200,
  });

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            select
            size="small"
            label="Período"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ProfitabilityPeriod)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          >
            {PERIODS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>

          {period === 'custom' && (
            <>
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
            </>
          )}

          <TextField
            select
            size="small"
            label="Cuadrante"
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value as typeof quadrant)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(QUADRANT_META) as ProfitabilityQuadrant[]).map((q) => (
              <MenuItem key={q} value={q}>
                {QUADRANT_META[q].emoji} {QUADRANT_META[q].label}
              </MenuItem>
            ))}
          </TextField>

          {data && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: { md: 'auto' } }}>
              {data.period.from} → {data.period.to} · {data.period.days} días · utilidad total{' '}
              <strong>{fmtUsd(data.summary.totalMarginUsd)}</strong>
            </Typography>
          )}
        </Stack>
      </Card>

      {!isCustomReady && <Alert severity="info">Elegí la fecha inicial para el rango custom.</Alert>}
      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">No se pudo cargar la rentabilidad.</Alert>}

      {data && (
        <>
          {/* Cuadrante visual margen×rotación */}
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cuadrante margen × rotación
            </Typography>
            <Grid container spacing={1}>
              {(['star', 'niche', 'traffic', 'dog'] as ProfitabilityQuadrant[]).map((q) => (
                <Grid key={q} size={{ xs: 6, md: 3 }}>
                  <QuadrantCard
                    quadrant={q}
                    count={data.summary[q]}
                    active={quadrant === q}
                    onClick={() => setQuadrant((prev) => (prev === q ? '' : q))}
                  />
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              ⭐ alto margen + alta rotación · 💎 alto margen, rota poco · 🚚 bajo margen pero vuela ·
              🐕 bajo margen y rota poco. Umbral = mediana del período.
            </Typography>
          </Card>

          {data.items.length === 0 ? (
            <Alert severity="warning">No hay ventas en el período para los filtros elegidos.</Alert>
          ) : (
            <Card sx={{ overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 44 }}>#</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Cuadrante</TableCell>
                    <TableCell align="right">Vendidas</TableCell>
                    <TableCell align="right">Margen %</TableCell>
                    <TableCell align="right">Rota/año</TableCell>
                    <TableCell align="right">Utilidad total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((it, idx) => (
                    <TableRow key={it.productId} hover>
                      <TableCell sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography variant="body2" noWrap title={it.name ?? ''}>
                          {it.name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <QuadrantChip quadrant={it.quadrant} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmt(it.unitsSold, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {fmtPct(it.marginPct, 1)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {it.turnoverAnnual != null ? `${fmt(it.turnoverAnnual, 1)}x` : '—'}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'success.dark' }}
                      >
                        {fmtUsd(it.totalMarginUsd)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </Stack>
  );
}

function QuadrantCard({
  quadrant,
  count,
  active,
  onClick,
}: {
  quadrant: ProfitabilityQuadrant;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const q = QUADRANT_META[quadrant];
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        cursor: 'pointer',
        textAlign: 'center',
        border: (theme) => `2px solid ${active ? theme.palette.text.primary : theme.palette.divider}`,
        bgcolor: 'background.neutral',
      }}
    >
      <Typography variant="h5">{q.emoji}</Typography>
      <Typography variant="subtitle2">{q.label}</Typography>
      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
        {count.toLocaleString('es-VE')}
      </Typography>
    </Box>
  );
}
