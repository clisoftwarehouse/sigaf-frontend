import { useState } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { AbcdChip } from '../components/abcd-chip';
import { fmt, fmtPct } from '../components/format';
import { useClassifications } from '../../api/intelligence.queries';

export function PortfolioView({ branchId }: { branchId: string }) {
  const [abcd, setAbcd] = useState<'' | 'A' | 'B' | 'C' | 'D'>('');
  const [paretoOnly, setParetoOnly] = useState(false);

  const { data, isLoading, isError } = useClassifications({
    branchId,
    abcd: abcd || undefined,
    isPareto: paretoOnly || undefined,
  });

  if (!branchId) {
    return <Alert severity="info">Elegí una sucursal para ver el portafolio.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            select
            size="small"
            label="Clase ABCD"
            value={abcd}
            onChange={(e) => setAbcd(e.target.value as typeof abcd)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="A">Solo A</MenuItem>
            <MenuItem value="B">Solo B</MenuItem>
            <MenuItem value="C">Solo C</MenuItem>
            <MenuItem value="D">Solo D</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch checked={paretoOnly} onChange={(e) => setParetoOnly(e.target.checked)} />
            }
            label="Solo Pareto (80/20)"
          />
          {data && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {data.length.toLocaleString('es-VE')} productos
            </Typography>
          )}
        </Stack>
      </Card>

      {isLoading && <LinearProgress />}

      {isError && <Alert severity="error">No se pudo cargar el portafolio.</Alert>}

      {data && data.length === 0 && !isLoading && (
        <Alert severity="warning">
          No hay clasificaciones para esos filtros. Ejecutá un recálculo desde la pestaña Sugerido.
        </Alert>
      )}

      {data && data.length > 0 && (
        <Card sx={{ overflow: 'hidden' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Clase</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Velocidad/día</TableCell>
                <TableCell align="right">Días inv.</TableCell>
                <TableCell align="right">Margen %</TableCell>
                <TableCell align="center">Vencimiento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ width: 110 }}>
                    <AbcdChip abcd={c.abcdClass} isPareto={c.isPareto} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    <Typography variant="body2">{c.productId}</Typography>
                    {c.forcedPromotionToB && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label="Ascenso forzado por Pareto"
                        sx={{ mt: 0.25, fontSize: '0.65rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {fmt(c.score, 2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmt(c.dailyVelocity, 2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {c.daysOfInventory != null ? fmt(c.daysOfInventory, 0) : '∞'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {fmtPct(c.marginPct, 1)}
                  </TableCell>
                  <TableCell align="center">
                    {c.expirySignal === 'GREEN' && <Chip size="small" color="success" label="✓" />}
                    {c.expirySignal === 'YELLOW' && (
                      <Chip size="small" color="warning" label="!" />
                    )}
                    {c.expirySignal === 'RED' && <Chip size="small" color="error" label="×" />}
                    {c.expirySignal === 'EXPIRED' && (
                      <Chip size="small" color="error" label="vencido" />
                    )}
                    {!c.expirySignal && '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
