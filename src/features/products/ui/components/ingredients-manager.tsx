import type { Product } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/app/components/iconify';
import { useActiveIngredientsQuery } from '@/features/active-ingredients/api/active-ingredients.queries';

import { productKeys } from '../../api/products.queries';
import { addProductIngredient, removeProductIngredient } from '../../api/products.api';

// ----------------------------------------------------------------------

type Props = {
  product: Product;
};

type NewIngredientState = {
  activeIngredientId: string;
  concentration: string;
  isPrimary: boolean;
};

const INITIAL_NEW: NewIngredientState = {
  activeIngredientId: '',
  concentration: '',
  isPrimary: false,
};

export function IngredientsManager({ product }: Props) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<NewIngredientState>(INITIAL_NEW);
  const { data: catalog = [] } = useActiveIngredientsQuery();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: productKeys.detail(product.id) });
    qc.invalidateQueries({ queryKey: productKeys.all });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      addProductIngredient(product.id, {
        activeIngredientId: adding.activeIngredientId,
        concentration: adding.concentration.trim() || undefined,
        isPrimary: adding.isPrimary,
      }),
    onSuccess: () => {
      toast.success('Principio activo agregado');
      setAdding(INITIAL_NEW);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (activeIngredientId: string) =>
      removeProductIngredient(product.id, activeIngredientId),
    onSuccess: () => {
      toast.success('Principio activo eliminado');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ingredients = product.activeIngredients ?? [];
  const usedIds = new Set(ingredients.map((i) => i.activeIngredientId));
  const available = catalog.filter((c) => !usedIds.has(c.id));

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
        Principios activos
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Usados para encontrar sustitutos genéricos cuando no hay stock del producto específico.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {ingredients.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled', py: 1 }}>
            Este producto no tiene principios activos registrados.
          </Typography>
        )}

        {ingredients.map((i) => {
          const name =
            i.activeIngredient?.name ??
            catalog.find((c) => c.id === i.activeIngredientId)?.name ??
            i.activeIngredientId;
          return (
            <Stack
              key={i.activeIngredientId}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">{name}</Typography>
                {i.activeIngredient?.therapeuticGroup && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {i.activeIngredient.therapeuticGroup}
                  </Typography>
                )}
              </Box>
              {i.concentration && (
                <Chip size="small" variant="outlined" label={i.concentration} />
              )}
              {i.isPrimary && <Chip size="small" color="info" label="Principal" />}
              <IconButton
                size="small"
                color="error"
                disabled={removeMutation.isPending}
                onClick={() => {
                  if (window.confirm(`¿Eliminar "${name}" del producto?`)) {
                    removeMutation.mutate(i.activeIngredientId);
                  }
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>

      <Box sx={{ mt: 3, pt: 2, borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}` }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Agregar principio activo
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            size="small"
            select
            label="Principio activo"
            value={adding.activeIngredientId}
            onChange={(e) =>
              setAdding((s) => ({ ...s, activeIngredientId: e.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 2 }}
          >
            <MenuItem value="">— Selecciona —</MenuItem>
            {available.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Concentración"
            placeholder="Ej. 500mg"
            value={adding.concentration}
            onChange={(e) => setAdding((s) => ({ ...s, concentration: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => setAdding((s) => ({ ...s, isPrimary: !s.isPrimary }))}
            color={adding.isPrimary ? 'info' : 'inherit'}
          >
            {adding.isPrimary ? 'Principal ✓' : 'Marcar principal'}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            disabled={!adding.activeIngredientId || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            Agregar
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}
