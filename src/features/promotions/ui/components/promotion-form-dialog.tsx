import type {
  PromotionType,
  PromotionScopeType,
  CreatePromotionPayload,
  CreatePromotionScopePayload,
} from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useCategoryOptions } from '@/features/categories/api/categories.options';

import { useCreatePromotionMutation } from '../../api/promotions.queries';
import { SCOPE_TYPE_LABEL, SCOPE_TYPE_OPTIONS, PROMOTION_TYPE_OPTIONS } from '../../model/types';

// ----------------------------------------------------------------------

type LocalScope = CreatePromotionScopePayload & { key: string; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Dialog de creación de promoción.
 *
 * Campos condicionales según `type`:
 *   - `percentage`   → `value` es % de descuento (0-100)
 *   - `fixed_amount` → `value` es USD a descontar por unidad
 *   - `buy_x_get_y`  → `buyQuantity` y `getQuantity` reemplazan a `value`
 *
 * Scopes son opcionales. Si no se agregan, la promoción aplica a TODOS los
 * productos y sucursales (semántica del backend).
 */
export function PromotionFormDialog({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PromotionType>('percentage');
  const [value, setValue] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('');
  const [getQuantity, setGetQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('1');
  const [maxUses, setMaxUses] = useState('');
  const [priority, setPriority] = useState('0');
  const [stackable, setStackable] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO);
  const [effectiveTo, setEffectiveTo] = useState('');
  const [scopes, setScopes] = useState<LocalScope[]>([]);

  const [scopeType, setScopeType] = useState<PromotionScopeType>('product');
  const [scopeId, setScopeId] = useState<string | null>(null);

  const { data: productOpts = [] } = useProductOptions();
  const { data: categoryOpts = [] } = useCategoryOptions();
  const { data: branchOpts = [] } = useBranchOptions();

  const createMutation = useCreatePromotionMutation();

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setType('percentage');
      setValue('');
      setBuyQuantity('');
      setGetQuantity('');
      setMinQuantity('1');
      setMaxUses('');
      setPriority('0');
      setStackable(false);
      setEffectiveFrom(todayISO());
      setEffectiveTo('');
      setScopes([]);
      setScopeType('product');
      setScopeId(null);
    }
  }, [open]);

  const currentScopeOptions = useMemo(() => {
    if (scopeType === 'product') return productOpts;
    if (scopeType === 'category') return categoryOpts;
    return branchOpts;
  }, [scopeType, productOpts, categoryOpts, branchOpts]);

  const addScope = () => {
    if (!scopeId) return;
    const option = currentScopeOptions.find((o) => o.id === scopeId);
    const key = `${scopeType}:${scopeId}`;
    if (scopes.some((s) => `${s.scopeType}:${s.scopeId}` === key)) {
      toast.info('Ese scope ya fue agregado');
      return;
    }
    setScopes((prev) => [...prev, { key, scopeType, scopeId, label: option?.label ?? scopeId }]);
    setScopeId(null);
  };

  const removeScope = (key: string) => {
    setScopes((prev) => prev.filter((s) => s.key !== key));
  };

  const canSubmit = useMemo(() => {
    if (!name.trim() || !effectiveFrom) return false;
    if (type === 'percentage') {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 && n <= 100;
    }
    if (type === 'fixed_amount') {
      const n = Number(value);
      return Number.isFinite(n) && n > 0;
    }
    // buy_x_get_y
    const b = Number(buyQuantity);
    const g = Number(getQuantity);
    return Number.isFinite(b) && b >= 1 && Number.isFinite(g) && g >= 1;
  }, [name, effectiveFrom, type, value, buyQuantity, getQuantity]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payload: CreatePromotionPayload = {
      name: name.trim(),
      type,
      value: type === 'buy_x_get_y' ? 0 : Number(value),
      effectiveFrom: new Date(`${effectiveFrom}T00:00:00`).toISOString(),
    };
    if (description.trim()) payload.description = description.trim();
    if (type === 'buy_x_get_y') {
      payload.buyQuantity = Number(buyQuantity);
      payload.getQuantity = Number(getQuantity);
    }
    if (minQuantity && Number(minQuantity) > 0) payload.minQuantity = Number(minQuantity);
    if (maxUses && Number(maxUses) > 0) payload.maxUses = Number(maxUses);
    if (priority) payload.priority = Number(priority);
    if (stackable) payload.stackable = true;
    if (effectiveTo) payload.effectiveTo = new Date(`${effectiveTo}T23:59:59`).toISOString();
    if (scopes.length > 0) {
      payload.scopes = scopes.map(({ scopeType: t, scopeId: s }) => ({ scopeType: t, scopeId: s }));
    }

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Promoción creada');
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Nueva promoción</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <TextField
            label="Nombre"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 200 } }}
            placeholder="Ej. Descuento 20% en analgésicos"
          />

          <TextField
            label="Descripción"
            multiline
            minRows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            select
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value as PromotionType)}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {PROMOTION_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {type === 'percentage' && (
            <TextField
              label="Descuento"
              type="number"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                htmlInput: { min: 0, max: 100, step: 0.1 },
              }}
              helperText="0-100 (% de descuento sobre el precio)"
            />
          )}

          {type === 'fixed_amount' && (
            <TextField
              label="Descuento por unidad"
              type="number"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: { endAdornment: <InputAdornment position="end">USD</InputAdornment> },
                htmlInput: { min: 0, step: 0.01 },
              }}
            />
          )}

          {type === 'buy_x_get_y' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Compra (cantidad)"
                type="number"
                required
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, step: 1 } }}
                sx={{ flex: 1 }}
                helperText="X unidades que paga"
              />
              <TextField
                label="Lleva (cantidad)"
                type="number"
                required
                value={getQuantity}
                onChange={(e) => setGetQuantity(e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, step: 1 } }}
                sx={{ flex: 1 }}
                helperText="Y unidades gratis"
              />
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Cantidad mínima"
              type="number"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0.001, step: 0.001 } }}
              sx={{ flex: 1 }}
              helperText="Mínimo para aplicar"
            />
            <TextField
              label="Máximo de usos"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, step: 1 } }}
              sx={{ flex: 1 }}
              helperText="Vacío = ilimitado"
            />
            <TextField
              label="Prioridad"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
              sx={{ flex: 1 }}
              helperText="Mayor gana"
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch checked={stackable} onChange={(_, checked) => setStackable(checked)} />
            }
            label="Stackable (puede combinarse con otras promociones)"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Vigente desde"
              type="date"
              required
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Vigente hasta"
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
              helperText="Opcional"
            />
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle2">Restricciones (scopes)</Typography>
            <Typography variant="caption" color="text.secondary">
              Sin scopes, la promoción aplica a TODOS los productos y sucursales. Agrega scopes para
              restringir a productos, categorías o sucursales específicas.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              sx={{ mt: 1.5 }}
            >
              <TextField
                select
                label="Tipo"
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value as PromotionScopeType);
                  setScopeId(null);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 180 } }}
              >
                {SCOPE_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              <Autocomplete
                options={currentScopeOptions}
                getOptionLabel={(opt) => opt.label ?? ''}
                value={currentScopeOptions.find((o) => o.id === scopeId) ?? null}
                onChange={(_, next) => setScopeId(next?.id ?? null)}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                sx={{ flex: 1, minWidth: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={SCOPE_TYPE_LABEL[scopeType]}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />

              <Button
                variant="outlined"
                onClick={addScope}
                disabled={!scopeId}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                sx={{ minWidth: 140, height: 56 }}
              >
                Agregar
              </Button>
            </Stack>

            {scopes.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                {scopes.map((s) => (
                  <Chip
                    key={s.key}
                    label={`${SCOPE_TYPE_LABEL[s.scopeType]}: ${s.label}`}
                    onDelete={() => removeScope(s.key)}
                    size="small"
                    variant="soft"
                    color="info"
                  />
                ))}
              </Stack>
            )}
          </Box>

          {type === 'buy_x_get_y' && buyQuantity && getQuantity && (
            <Alert severity="info">
              Ejemplo: el cliente compra <strong>{buyQuantity}</strong> unidades y se lleva{' '}
              <strong>{Number(buyQuantity) + Number(getQuantity)}</strong> (de las cuales{' '}
              {getQuantity} son gratis).
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={createMutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || createMutation.isPending}
          loading={createMutation.isPending}
        >
          Crear promoción
        </Button>
      </DialogActions>
    </Dialog>
  );
}
