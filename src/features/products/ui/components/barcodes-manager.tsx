import type { Product, ProductBarcode } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/app/components/iconify';

import { productKeys } from '../../api/products.queries';
import { BARCODE_TYPE_OPTIONS } from '../../model/constants';
import {
  addProductBarcode,
  removeProductBarcode,
  updateProductBarcode,
} from '../../api/products.api';

// ----------------------------------------------------------------------

type Props = {
  product: Product;
};

type BarcodeType = 'ean13' | 'ean8' | 'upc' | 'internal' | 'national' | 'international';

type NewBarcodeState = {
  barcode: string;
  barcodeType: BarcodeType;
  isPrimary: boolean;
};

const INITIAL_NEW_BARCODE: NewBarcodeState = {
  barcode: '',
  barcodeType: 'ean13',
  isPrimary: false,
};

export function BarcodesManager({ product }: Props) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<NewBarcodeState>(INITIAL_NEW_BARCODE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NewBarcodeState>(INITIAL_NEW_BARCODE);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: productKeys.detail(product.id) });
    qc.invalidateQueries({ queryKey: productKeys.all });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      addProductBarcode(product.id, {
        barcode: adding.barcode.trim(),
        barcodeType: adding.barcodeType,
        isPrimary: adding.isPrimary,
      }),
    onSuccess: () => {
      toast.success('Código de barras agregado');
      setAdding(INITIAL_NEW_BARCODE);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (barcodeId: string) => removeProductBarcode(product.id, barcodeId),
    onSuccess: () => {
      toast.success('Código eliminado');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; barcode: string; barcodeType: BarcodeType; isPrimary: boolean }) =>
      updateProductBarcode(product.id, vars.id, {
        barcode: vars.barcode.trim(),
        barcodeType: vars.barcodeType,
        isPrimary: vars.isPrimary,
      }),
    onSuccess: () => {
      toast.success('Código actualizado');
      setEditingId(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (b: ProductBarcode) => {
    setEditingId(b.id);
    setEditDraft({
      barcode: b.barcode,
      barcodeType: b.barcodeType as BarcodeType,
      isPrimary: b.isPrimary,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(INITIAL_NEW_BARCODE);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      barcode: editDraft.barcode,
      barcodeType: editDraft.barcodeType,
      isPrimary: editDraft.isPrimary,
    });
  };

  const barcodes = product.barcodes ?? [];

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
        Códigos de barras
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Un producto puede tener varios códigos (EAN-13, UPC, internos, etc.). Marca uno como
        principal.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {barcodes.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled', py: 1 }}>
            Este producto aún no tiene códigos de barras.
          </Typography>
        )}

        {barcodes.map((b) =>
          editingId === b.id ? (
            <Stack
              key={b.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}
            >
              <TextField
                size="small"
                label="Código"
                value={editDraft.barcode}
                onChange={(e) => setEditDraft((s) => ({ ...s, barcode: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 2 }}
              />
              <TextField
                size="small"
                select
                label="Tipo"
                value={editDraft.barcodeType}
                onChange={(e) =>
                  setEditDraft((s) => ({ ...s, barcodeType: e.target.value as BarcodeType }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 140 }}
              >
                {BARCODE_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEditDraft((s) => ({ ...s, isPrimary: !s.isPrimary }))}
                color={editDraft.isPrimary ? 'info' : 'inherit'}
              >
                {editDraft.isPrimary ? 'Principal ✓' : 'No principal'}
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={!editDraft.barcode.trim() || updateMutation.isPending}
                onClick={saveEdit}
              >
                Guardar
              </Button>
              <Button variant="text" size="small" onClick={cancelEdit}>
                Cancelar
              </Button>
            </Stack>
          ) : (
            <Stack
              key={b.id}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}
            >
              <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                {b.barcode}
              </Typography>
              <Chip size="small" variant="outlined" label={b.barcodeType} />
              {b.isPrimary && <Chip size="small" color="info" label="Principal" />}
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => startEdit(b)}>
                  <Iconify icon="solar:pen-bold" width={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el código "${b.barcode}"?`)) {
                      removeMutation.mutate(b.id);
                    }
                  }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        )}
      </Stack>

      <Box sx={{ mt: 3, pt: 2, borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}` }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Agregar nuevo código
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            size="small"
            label="Código"
            placeholder="7501234567890"
            value={adding.barcode}
            onChange={(e) => setAdding((s) => ({ ...s, barcode: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 2 }}
          />
          <TextField
            size="small"
            select
            label="Tipo"
            value={adding.barcodeType}
            onChange={(e) =>
              setAdding((s) => ({ ...s, barcodeType: e.target.value as BarcodeType }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 140 }}
          >
            {BARCODE_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
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
            disabled={!adding.barcode.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            Agregar
          </Button>
        </Stack>
        {adding.isPrimary && barcodes.some((b) => b.isPrimary) && (
          <Typography variant="caption" sx={{ color: 'warning.main', mt: 1, display: 'block' }}>
            Al guardar, el código actualmente principal dejará de serlo automáticamente.
          </Typography>
        )}
      </Box>
    </Card>
  );
}
