import type { SuggestionRun, SuggestionItem } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';

import { AbcdChip } from '../components/abcd-chip';
import { fmt, toNumber } from '../components/format';
import { DecisionChip } from '../components/decision-chip';
import {
  useGenerateSuggestions,
  useRecalculatePortfolio,
  useCreateOrdersFromSuggestions,
} from '../../api/intelligence.queries';

type EditableItem = SuggestionItem & { selected: boolean; editedQuantity: number };

export function SuggestionsView({ branchId }: { branchId: string }) {
  const [budgetUsd, setBudgetUsd] = useState<string>('');
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [run, setRun] = useState<SuggestionRun | null>(null);

  const recalc = useRecalculatePortfolio();
  const generate = useGenerateSuggestions();
  const createOrders = useCreateOrdersFromSuggestions();

  const handleRecalc = () => {
    recalc.mutate(branchId, {
      onSuccess: (r) => {
        toast.success(
          `Recalculado: ${r.totalProducts} productos. A:${r.distribution.A} · B:${r.distribution.B} · C:${r.distribution.C} · D:${r.distribution.D}`,
        );
      },
      onError: (err: Error) => toast.error(`Error al recalcular: ${err.message}`),
    });
  };

  const handleGenerate = () => {
    generate.mutate(
      {
        branchId,
        budgetUsd: budgetUsd ? Number(budgetUsd) : undefined,
      },
      {
        onSuccess: (r) => {
          setRun(r);
          setItems(
            r.items.map((it) => ({
              ...it,
              selected:
                it.decision === 'buy_urgent' ||
                it.decision === 'buy' ||
                it.decision === 'buy_moderate',
              editedQuantity: it.suggestedQuantity,
            })),
          );
          toast.success(`Sugerido generado: ${r.itemsCount} ítems`);
        },
        onError: (err: Error) => toast.error(`Error al generar sugerido: ${err.message}`),
      },
    );
  };

  const toggleAll = (checked: boolean) => {
    if (!items) return;
    setItems(items.map((it) => ({ ...it, selected: checked && it.suggestedQuantity > 0 })));
  };

  const toggleOne = (productId: string, checked: boolean) => {
    if (!items) return;
    setItems(items.map((it) => (it.productId === productId ? { ...it, selected: checked } : it)));
  };

  const editQuantity = (productId: string, qty: number) => {
    if (!items) return;
    setItems(
      items.map((it) =>
        it.productId === productId ? { ...it, editedQuantity: Math.max(0, qty) } : it,
      ),
    );
  };

  const handleCreateOrders = () => {
    if (!items) return;
    const selected = items.filter(
      (it) => it.selected && it.editedQuantity > 0 && it.bestSupplier,
    );
    if (selected.length === 0) {
      toast.warning('No hay ítems seleccionados con droguería asignada y cantidad > 0');
      return;
    }
    createOrders.mutate(
      {
        branchId,
        suggestions: selected.map((it) => ({
          productId: it.productId,
          quantity: it.editedQuantity,
          supplierId: it.bestSupplier!.supplierId,
          netCostUsd: it.bestSupplier!.netCostUsd,
          decision: it.decision,
          reason: it.reason,
        })),
        notes: `Generadas desde sugerido del motor (${new Date().toLocaleString('es-VE')})`,
      },
      {
        onSuccess: (orders) => {
          toast.success(
            `${orders.length} OC${orders.length === 1 ? '' : 's'} creada${
              orders.length === 1 ? '' : 's'
            } en estado borrador.`,
          );
          setItems(null);
          setRun(null);
        },
        onError: (err: Error) => toast.error(`Error al crear OCs: ${err.message}`),
      },
    );
  };

  if (!branchId) {
    return <Alert severity="info">Elegí una sucursal para generar sugerido.</Alert>;
  }

  const selectedCount = items?.filter((it) => it.selected).length ?? 0;
  const selectedTotalUsd = items
    ? items
        .filter((it) => it.selected)
        .reduce(
          (sum, it) =>
            sum + toNumber(it.bestSupplier?.netCostUsd) * toNumber(it.editedQuantity),
          0,
        )
    : 0;

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={handleRecalc}
            disabled={recalc.isPending}
          >
            {recalc.isPending ? 'Recalculando…' : 'Recalcular portafolio'}
          </Button>

          <Box sx={{ flex: 1 }} />

          <TextField
            size="small"
            label="Presupuesto USD (opcional)"
            type="number"
            value={budgetUsd}
            onChange={(e) => setBudgetUsd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:list-bold" />}
            onClick={handleGenerate}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'Generando…' : 'Generar sugerido'}
          </Button>
        </Stack>
      </Card>

      {(recalc.isPending || generate.isPending) && <LinearProgress />}

      {run && items && (
        <Card sx={{ overflow: 'hidden' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Sugerido ({run.itemsCount} ítems · total estimado Bs. {/* en USD */}
              USD {toNumber(run.totalEstimatedUsd).toLocaleString('es-VE')})
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                color="primary"
                label={`${selectedCount} seleccionados · USD ${fmt(selectedTotalUsd, 2)}`}
              />
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<Iconify icon="solar:cart-plus-bold" />}
                disabled={selectedCount === 0 || createOrders.isPending}
                onClick={handleCreateOrders}
              >
                {createOrders.isPending ? 'Creando…' : 'Crear OCs seleccionadas'}
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ overflow: 'auto', maxHeight: '70vh' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }}>
                    <Checkbox
                      size="small"
                      checked={items.every((i) => i.selected)}
                      indeterminate={
                        items.some((i) => i.selected) && !items.every((i) => i.selected)
                      }
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Clase</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Vel./día</TableCell>
                  <TableCell align="right">Días cob.</TableCell>
                  <TableCell align="right">Sugerido</TableCell>
                  <TableCell>Cantidad final</TableCell>
                  <TableCell>Droguería</TableCell>
                  <TableCell align="right">Costo USD</TableCell>
                  <TableCell>Decisión</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.productId} hover selected={it.selected}>
                    <TableCell>
                      <Checkbox
                        size="small"
                        checked={it.selected}
                        disabled={it.suggestedQuantity === 0 && !it.bestSupplier}
                        onChange={(e) => toggleOne(it.productId, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <AbcdChip abcd={it.abcdClass} isPareto={it.isPareto} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" noWrap title={it.productName}>
                        {it.productName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: '0.65rem' }}
                      >
                        {it.reason}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmt(it.currentStock, 0)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmt(it.dailyVelocity, 2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {it.coverageDays}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {it.suggestedQuantity}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={it.editedQuantity}
                        onChange={(e) => editQuantity(it.productId, Number(e.target.value))}
                        sx={{ width: 90 }}
                        disabled={!it.bestSupplier}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      {it.bestSupplier ? (
                        <Stack spacing={0.25}>
                          <Typography variant="caption" noWrap title={it.bestSupplier.supplierName}>
                            {it.bestSupplier.supplierName}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Score {fmt(it.bestSupplier.score, 0)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {it.bestSupplier
                        ? fmt(toNumber(it.bestSupplier.netCostUsd) * toNumber(it.editedQuantity), 2)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DecisionChip decision={it.decision} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {!run && !generate.isPending && (
        <Alert severity="info">
          Recalculá el portafolio si los datos están desactualizados, luego presioná{' '}
          <strong>Generar sugerido</strong> para ver la lista de productos a comprar.
        </Alert>
      )}
    </Stack>
  );
}
