import type { GridColDef } from '@mui/x-data-grid';
import type { SupplierProduct, CreateSupplierProductPayload } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { DataTable } from '@/app/components/data-table';
import { useProductOptions } from '@/features/products/api/products.options';

import {
  useSupplierProductsQuery,
  useCreateSupplierProductMutation,
  useUpdateSupplierProductMutation,
} from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

type Draft = {
  productId: string;
  supplierSku: string;
  costUsd: string;
  discountPct: string;
  isAvailable: boolean;
};

const emptyDraft = (): Draft => ({
  productId: '',
  supplierSku: '',
  costUsd: '',
  discountPct: '',
  isAvailable: true,
});

interface Props {
  supplierId: string;
}

export function SupplierProductsTab({ supplierId }: Props) {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSupplierProductsQuery(supplierId);
  const createMutation = useCreateSupplierProductMutation(supplierId);
  const updateMutation = useUpdateSupplierProductMutation(supplierId);

  const { data: productOpts = [] } = useProductOptions();
  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );

  const [editing, setEditing] = useState<SupplierProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const openCreate = () => {
    setDraft(emptyDraft());
    setCreating(true);
  };

  const openEdit = (sp: SupplierProduct) => {
    setEditing(sp);
    setDraft({
      productId: sp.productId,
      supplierSku: sp.supplierSku ?? '',
      costUsd: sp.costUsd != null ? String(sp.costUsd) : '',
      discountPct: sp.discountPct != null ? String(sp.discountPct) : '',
      isAvailable: sp.isAvailable,
    });
  };

  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    if (!draft.productId) {
      toast.error('Selecciona un producto');
      return;
    }
    const payload: CreateSupplierProductPayload = {
      productId: draft.productId,
      supplierSku: draft.supplierSku.trim() || undefined,
      costUsd: draft.costUsd ? Number(draft.costUsd) : undefined,
      discountPct: draft.discountPct ? Number(draft.discountPct) : undefined,
      isAvailable: draft.isAvailable,
    };
    try {
      if (editing) {
        const { productId: _ignored, ...updatePayload } = payload;
        await updateMutation.mutateAsync({
          supplierProductId: editing.id,
          payload: updatePayload,
        });
        toast.success('Asociación actualizada');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Producto asociado');
      }
      closeDialog();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<SupplierProduct>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 220,
        valueFormatter: (value: string) => productNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (productNameById.get(a) ?? '').localeCompare(productNameById.get(b) ?? ''),
      },
      {
        field: 'supplierSku',
        headerName: 'SKU proveedor',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string | null) => value ?? '—',
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'costUsd',
        headerName: 'Costo USD',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) => (value == null ? null : Number(value)),
        valueFormatter: (value: number | null) => (value == null ? '—' : `$${value.toFixed(2)}`),
      },
      {
        field: 'lastCostUsd',
        headerName: 'Costo anterior',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string | null) => (value == null ? null : Number(value)),
        valueFormatter: (value: number | null) => (value == null ? '—' : `$${value.toFixed(2)}`),
      },
      {
        field: 'discountPct',
        headerName: 'Descuento',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) => (value == null ? null : Number(value)),
        valueFormatter: (value: number | null) => (value == null ? '—' : `${value.toFixed(2)}%`),
      },
      {
        field: 'isAvailable',
        headerName: 'Disponible',
        type: 'boolean',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Editar">
            <IconButton onClick={() => openEdit(row)}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [productNameById]
  );

  const dialogOpen = creating || editing !== null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Productos asociados ({items.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Asociar producto
        </Button>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          {(error as Error)?.message ?? 'Error al cargar productos'}
        </Alert>
      )}

      <Box sx={{ width: '100%' }}>
        <DataTable
          columns={columns}
          rows={items}
          loading={isLoading}
          disableRowSelectionOnClick
          autoHeight
        />
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xl" fullWidth>
        <DialogTitle>{editing ? 'Editar asociación' : 'Asociar producto'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Producto"
              value={draft.productId}
              onChange={(e) => setDraft({ ...draft, productId: e.target.value })}
              disabled={Boolean(editing)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {productOpts.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="SKU del proveedor"
              value={draft.supplierSku}
              onChange={(e) => setDraft({ ...draft, supplierSku: e.target.value })}
              placeholder="SKU-LAB-1234"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Costo USD"
                type="number"
                value={draft.costUsd}
                onChange={(e) => setDraft({ ...draft, costUsd: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 0.01, min: 0 } }}
              />
              <TextField
                label="Descuento %"
                type="number"
                value={draft.discountPct}
                onChange={(e) => setDraft({ ...draft, discountPct: e.target.value })}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { step: 0.01, min: 0, max: 100 },
                }}
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={draft.isAvailable}
                  onChange={(e) => setDraft({ ...draft, isAvailable: e.target.checked })}
                />
              }
              label="Disponible"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={save}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? 'Guardar' : 'Asociar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
