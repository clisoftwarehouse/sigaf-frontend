import type { Promotion, PromotionScopeType } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from '@/app/components/iconify';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useCategoryOptions } from '@/features/categories/api/categories.options';

import { SCOPE_TYPE_LABEL, SCOPE_TYPE_OPTIONS } from '../../model/types';
import { useAddScopeMutation, useRemoveScopeMutation } from '../../api/promotions.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  /** Promoción cuyos scopes se gestionan. Debe venir con `scopes` populados. */
  promotion: Promotion | null;
};

/**
 * Dialog para gestionar scopes (restricciones) de una promoción existente.
 * Permite agregar y quitar scopes por tipo (producto / categoría / sucursal).
 * Si la promoción queda sin scopes, aplica a todos los productos y sucursales.
 */
export function PromotionScopesDialog({ open, onClose, promotion }: Props) {
  const [scopeType, setScopeType] = useState<PromotionScopeType>('product');
  const [scopeId, setScopeId] = useState<string | null>(null);

  const { data: productOpts = [] } = useProductOptions();
  const { data: categoryOpts = [] } = useCategoryOptions();
  const { data: branchOpts = [] } = useBranchOptions();

  const addMutation = useAddScopeMutation();
  const removeMutation = useRemoveScopeMutation();

  const currentOptions = useMemo(() => {
    if (scopeType === 'product') return productOpts;
    if (scopeType === 'category') return categoryOpts;
    return branchOpts;
  }, [scopeType, productOpts, categoryOpts, branchOpts]);

  const labelByTypeAndId = useMemo(() => {
    const map = new Map<string, string>();
    productOpts.forEach((o) => map.set(`product:${o.id}`, o.label ?? o.id));
    categoryOpts.forEach((o) => map.set(`category:${o.id}`, o.label ?? o.id));
    branchOpts.forEach((o) => map.set(`branch:${o.id}`, o.label ?? o.id));
    return map;
  }, [productOpts, categoryOpts, branchOpts]);

  const handleAdd = async () => {
    if (!promotion || !scopeId) return;
    try {
      await addMutation.mutateAsync({ id: promotion.id, payload: { scopeType, scopeId } });
      toast.success('Scope agregado');
      setScopeId(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRemove = async (scopeEntityId: string) => {
    if (!promotion) return;
    try {
      await removeMutation.mutateAsync({ id: promotion.id, scopeId: scopeEntityId });
      toast.success('Scope eliminado');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const existingScopes = promotion?.scopes ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Restricciones de &quot;{promotion?.name ?? ''}&quot;</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info">
            {existingScopes.length === 0
              ? 'Sin restricciones: la promoción aplica a TODOS los productos y sucursales.'
              : `${existingScopes.length} restricción${existingScopes.length === 1 ? '' : 'es'} activa${existingScopes.length === 1 ? '' : 's'}.`}
          </Alert>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Scopes actuales
            </Typography>
            {existingScopes.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                Ninguno.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {existingScopes.map((s) => {
                  const label =
                    labelByTypeAndId.get(`${s.scopeType}:${s.scopeId}`) ?? s.scopeId.slice(0, 8);
                  return (
                    <Chip
                      key={s.id}
                      label={`${SCOPE_TYPE_LABEL[s.scopeType]}: ${label}`}
                      onDelete={() => handleRemove(s.id)}
                      size="small"
                      variant="soft"
                      color="info"
                    />
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Agregar scope
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
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
                options={currentOptions}
                getOptionLabel={(opt) => opt.label ?? ''}
                value={currentOptions.find((o) => o.id === scopeId) ?? null}
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
                onClick={handleAdd}
                disabled={!scopeId || addMutation.isPending}
                loading={addMutation.isPending}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                sx={{ minWidth: 140, height: 56 }}
              >
                Agregar
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
