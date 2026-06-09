import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from '@/app/components/iconify';
import axiosInstance, { endpoints } from '@/shared/lib/axios';

import {
  useLabConditions,
  useCreateLabCondition,
  useUpdateLabCondition,
  useDeleteLabCondition,
  useDrugstoreConditions,
  useCreateDrugstoreCondition,
  useUpdateDrugstoreCondition,
  useDeleteDrugstoreCondition,
} from '../../api/intelligence.queries';

type Supplier = { id: string; tradeName?: string; businessName?: string };
type Brand = { id: string; name: string };

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await axiosInstance.get(endpoints.suppliers.root, { params: { limit: 200 } });
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}
async function fetchBrands(): Promise<Brand[]> {
  const { data } = await axiosInstance.get(endpoints.brands.root, { params: { limit: 500 } });
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}

export function ConditionsView() {
  const [tab, setTab] = useState<'drugstore' | 'lab'>('drugstore');

  return (
    <Stack spacing={2}>
      <Alert severity="info" variant="outlined">
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          ¿Qué son las condiciones comerciales?
        </Typography>
        <Typography variant="caption" component="div" color="text.secondary">
          Son los descuentos <strong>framework</strong> que negociaste con droguerías y laboratorios.
          El motor los multiplica al costo del proveedor para calcular el costo neto real al comprar.
          Esto convive con el descuento puntual que ya existe en <em>Proveedores → Productos del
          proveedor</em> (campo Descuento %) — ese sigue funcionando para descuentos por SKU
          específico. Los layers se aplican en cascada multiplicativa:
        </Typography>
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
          sx={{ mt: 0.5, fontFamily: 'monospace' }}
        >
          net = base × (1−sku) × (1−cabecera) × (1−lineal) × (1−volumen) × (1−escala) × (1−pronto pago)
        </Typography>
      </Alert>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="drugstore" label="Condiciones por droguería" />
        <Tab value="lab" label="Condiciones por laboratorio" />
      </Tabs>
      {tab === 'drugstore' && <DrugstoreConditionsTab />}
      {tab === 'lab' && <LabConditionsTab />}
    </Stack>
  );
}

// ─── Drugstore conditions ──────────────────────────────────────────

function DrugstoreConditionsTab() {
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', 'lookup'],
    queryFn: fetchSuppliers,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading } = useDrugstoreConditions();
  const createMut = useCreateDrugstoreCondition();
  const updateMut = useUpdateDrugstoreCondition();
  const deleteMut = useDeleteDrugstoreCondition();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    supplierId: '',
    cabeceraPct: 0,
    volumenPct: 0,
    prontoPagoPct: 0,
    volumenMinUsd: '',
    volumenMinUnits: '',
    creditDays: 30,
    deliveryDays: 2,
    notes: '',
  });

  const supplierName = (id: string) => {
    const s = suppliers?.find((x) => x.id === id);
    return s?.tradeName || s?.businessName || id;
  };

  const handleSave = () => {
    const payload = {
      supplierId: form.supplierId,
      cabeceraPct: Number(form.cabeceraPct) || 0,
      volumenPct: Number(form.volumenPct) || 0,
      prontoPagoPct: Number(form.prontoPagoPct) || 0,
      volumenMinUsd: form.volumenMinUsd ? Number(form.volumenMinUsd) : null,
      volumenMinUnits: form.volumenMinUnits ? Number(form.volumenMinUnits) : null,
      creditDays: Number(form.creditDays) || 30,
      deliveryDays: Number(form.deliveryDays) || 2,
      notes: form.notes || null,
    };
    if (!payload.supplierId) {
      toast.warning('Elegí una droguería');
      return;
    }

    const onSuccess = () => {
      setOpenForm(false);
      setEditing(null);
      toast.success('Condición guardada');
    };
    const onError = (err: Error) =>
      toast.error(`Error: ${err.message}`);

    if (editing) {
      updateMut.mutate({ id: editing, input: payload }, { onSuccess, onError });
    } else {
      createMut.mutate(payload, { onSuccess, onError });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      supplierId: '',
      cabeceraPct: 0,
      volumenPct: 0,
      prontoPagoPct: 0,
      volumenMinUsd: '',
      volumenMinUnits: '',
      creditDays: 30,
      deliveryDays: 2,
      notes: '',
    });
    setOpenForm(true);
  };

  const openEdit = (id: string) => {
    const cond = data?.find((c) => c.id === id);
    if (!cond) return;
    setEditing(id);
    setForm({
      supplierId: cond.supplierId,
      cabeceraPct: cond.cabeceraPct,
      volumenPct: cond.volumenPct,
      prontoPagoPct: cond.prontoPagoPct,
      volumenMinUsd: cond.volumenMinUsd?.toString() ?? '',
      volumenMinUnits: cond.volumenMinUnits?.toString() ?? '',
      creditDays: cond.creditDays ?? 30,
      deliveryDays: cond.deliveryDays ?? 2,
      notes: cond.notes ?? '',
    });
    setOpenForm(true);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {data?.length ?? 0} condiciones registradas. Capas multiplicativas: cabecera × volumen ×
          pronto pago.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Agregar condición
        </Button>
      </Stack>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Droguería</TableCell>
              <TableCell align="right">Cabecera %</TableCell>
              <TableCell align="right">Volumen %</TableCell>
              <TableCell align="right">Pronto pago %</TableCell>
              <TableCell align="right">Crédito d</TableCell>
              <TableCell align="right">Entrega d</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>Cargando…</TableCell>
              </TableRow>
            )}
            {data && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Alert severity="info" sx={{ my: 1 }}>
                    Sin condiciones registradas todavía.
                  </Alert>
                </TableCell>
              </TableRow>
            )}
            {data?.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{supplierName(c.supplierId)}</TableCell>
                <TableCell align="right">{c.cabeceraPct}</TableCell>
                <TableCell align="right">{c.volumenPct}</TableCell>
                <TableCell align="right">{c.prontoPagoPct}</TableCell>
                <TableCell align="right">{c.creditDays ?? '—'}</TableCell>
                <TableCell align="right">{c.deliveryDays ?? '—'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(c.id)}>
                    <Iconify icon="solar:pen-bold" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (!confirm('¿Desactivar esta condición?')) return;
                      deleteMut.mutate(c.id);
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? 'Editar condición de droguería' : 'Nueva condición de droguería'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Droguería"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              fullWidth
              size="small"
              disabled={!!editing}
            >
              <MenuItem value="">— Elegir —</MenuItem>
              {(suppliers ?? []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.tradeName || s.businessName}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Cabecera %"
                type="number"
                value={form.cabeceraPct}
                onChange={(e) => setForm({ ...form, cabeceraPct: Number(e.target.value) })}
                size="small"
                helperText="Descuento general que aplica siempre a todo lo comprado en esta droguería"
              />
              <TextField
                label="Volumen %"
                type="number"
                value={form.volumenPct}
                onChange={(e) => setForm({ ...form, volumenPct: Number(e.target.value) })}
                size="small"
                helperText="Descuento extra cuando la compra supera el umbral USD o de unidades"
              />
              <TextField
                label="Pronto pago %"
                type="number"
                value={form.prontoPagoPct}
                onChange={(e) => setForm({ ...form, prontoPagoPct: Number(e.target.value) })}
                size="small"
                helperText="Descuento si pagás en plazo. Sólo se muestra como escenario financiero, no afecta el margen base"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Volumen mín. USD"
                type="number"
                value={form.volumenMinUsd}
                onChange={(e) => setForm({ ...form, volumenMinUsd: e.target.value })}
                size="small"
              />
              <TextField
                label="Volumen mín. unidades"
                type="number"
                value={form.volumenMinUnits}
                onChange={(e) => setForm({ ...form, volumenMinUnits: e.target.value })}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Días de crédito"
                type="number"
                value={form.creditDays}
                onChange={(e) => setForm({ ...form, creditDays: Number(e.target.value) })}
                size="small"
              />
              <TextField
                label="Días de entrega"
                type="number"
                value={form.deliveryDays}
                onChange={(e) => setForm({ ...form, deliveryDays: Number(e.target.value) })}
                size="small"
              />
            </Box>
            <TextField
              label="Notas"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMut.isPending || updateMut.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// ─── Lab conditions ──────────────────────────────────────────────────

function LabConditionsTab() {
  const { data: brands } = useQuery({
    queryKey: ['brands', 'lookup'],
    queryFn: fetchBrands,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading } = useLabConditions();
  const createMut = useCreateLabCondition();
  const updateMut = useUpdateLabCondition();
  const deleteMut = useDeleteLabCondition();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    brandId: '',
    linealPct: 0,
    escalaPct: 0,
    escalaMinUnits: '',
    notes: '',
  });

  const brandName = (id: string) => brands?.find((b) => b.id === id)?.name ?? id;

  const handleSave = () => {
    const payload = {
      brandId: form.brandId,
      linealPct: Number(form.linealPct) || 0,
      escalaPct: Number(form.escalaPct) || 0,
      escalaMinUnits: form.escalaMinUnits ? Number(form.escalaMinUnits) : null,
      notes: form.notes || null,
    };
    if (!payload.brandId) {
      toast.warning('Elegí un laboratorio');
      return;
    }
    if (payload.escalaPct > 0 && !payload.escalaMinUnits) {
      toast.warning('Si configurás escala, debés indicar cantidad mínima');
      return;
    }
    const onSuccess = () => {
      setOpenForm(false);
      setEditing(null);
      toast.success('Condición guardada');
    };
    const onError = (err: Error) =>
      toast.error(`Error: ${err.message}`);

    if (editing) {
      updateMut.mutate({ id: editing, input: payload }, { onSuccess, onError });
    } else {
      createMut.mutate(payload, { onSuccess, onError });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ brandId: '', linealPct: 0, escalaPct: 0, escalaMinUnits: '', notes: '' });
    setOpenForm(true);
  };

  const openEdit = (id: string) => {
    const cond = data?.find((c) => c.id === id);
    if (!cond) return;
    setEditing(id);
    setForm({
      brandId: cond.brandId,
      linealPct: cond.linealPct,
      escalaPct: cond.escalaPct,
      escalaMinUnits: cond.escalaMinUnits?.toString() ?? '',
      notes: cond.notes ?? '',
    });
    setOpenForm(true);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {data?.length ?? 0} condiciones. Lineal aplica siempre; escala solo si se cumple la
          cantidad mínima.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Agregar condición
        </Button>
      </Stack>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Laboratorio</TableCell>
              <TableCell align="right">Lineal %</TableCell>
              <TableCell align="right">Escala %</TableCell>
              <TableCell align="right">Mín. unidades</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Cargando…</TableCell>
              </TableRow>
            )}
            {data && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Alert severity="info" sx={{ my: 1 }}>
                    Sin condiciones registradas todavía.
                  </Alert>
                </TableCell>
              </TableRow>
            )}
            {data?.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{brandName(c.brandId)}</TableCell>
                <TableCell align="right">{c.linealPct}</TableCell>
                <TableCell align="right">{c.escalaPct}</TableCell>
                <TableCell align="right">{c.escalaMinUnits ?? '—'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(c.id)}>
                    <Iconify icon="solar:pen-bold" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (!confirm('¿Desactivar esta condición?')) return;
                      deleteMut.mutate(c.id);
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? 'Editar condición de laboratorio' : 'Nueva condición de laboratorio'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Laboratorio"
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              fullWidth
              size="small"
              disabled={!!editing}
            >
              <MenuItem value="">— Elegir —</MenuItem>
              {(brands ?? []).map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Lineal %"
                type="number"
                value={form.linealPct}
                onChange={(e) => setForm({ ...form, linealPct: Number(e.target.value) })}
                size="small"
                helperText="Descuento del laboratorio que aplica siempre a sus productos"
              />
              <TextField
                label="Escala %"
                type="number"
                value={form.escalaPct}
                onChange={(e) => setForm({ ...form, escalaPct: Number(e.target.value) })}
                size="small"
                helperText="Descuento extra si pedís ≥ mínimo de unidades"
              />
              <TextField
                label="Mín. unidades"
                type="number"
                value={form.escalaMinUnits}
                onChange={(e) => setForm({ ...form, escalaMinUnits: e.target.value })}
                size="small"
                helperText="Umbral para activar la escala"
              />
            </Box>
            <TextField
              label="Notas"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMut.isPending || updateMut.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
