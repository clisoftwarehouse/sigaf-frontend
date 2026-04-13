import type { ConfigMap } from '../../api/config.api';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { useConfigQuery, useUpdateConfigMutation } from '../../api/config.queries';

// ----------------------------------------------------------------------

type Row = { key: string; value: string; dirty: boolean; isNew?: boolean };

function mapToRows(m: ConfigMap): Row[] {
  return Object.entries(m)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value, dirty: false }));
}

export function ConfigView() {
  const { data: config, isLoading, isError, error, refetch } = useConfigQuery();
  const mutation = useUpdateConfigMutation();

  const [rows, setRows] = useState<Row[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (config) setRows(mapToRows(config));
  }, [config]);

  const dirtyCount = useMemo(() => rows.filter((r) => r.dirty).length, [rows]);

  const handleValueChange = (key: string, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, value, dirty: r.isNew ? true : r.value !== value || r.dirty } : r
      )
    );
  };

  const handleAddRow = () => {
    const key = newKey.trim();
    if (!key) {
      toast.error('El nombre de la clave es obligatorio');
      return;
    }
    if (rows.some((r) => r.key === key)) {
      toast.error(`Ya existe una clave llamada "${key}"`);
      return;
    }
    setRows((prev) => [...prev, { key, value: newValue, dirty: true, isNew: true }]);
    setNewKey('');
    setNewValue('');
  };

  const handleSave = async () => {
    const dirty = rows.filter((r) => r.dirty);
    if (dirty.length === 0) {
      toast.info?.('No hay cambios para guardar');
      return;
    }

    const payload: ConfigMap = {};
    dirty.forEach((r) => {
      payload[r.key] = r.value;
    });

    try {
      await mutation.mutateAsync(payload);
      toast.success(`${dirty.length} ${dirty.length === 1 ? 'entrada actualizada' : 'entradas actualizadas'}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleReset = () => {
    if (config) setRows(mapToRows(config));
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Configuración global"
        subtitle="Parámetros del sistema (IVA, IGTF, tasas BCV, límites de descuento, etc.)."
        crumbs={[{ label: 'Administración' }, { label: 'Configuración' }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" color="inherit" onClick={handleReset} disabled={dirtyCount === 0}>
              Descartar
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              loading={mutation.isPending}
              disabled={dirtyCount === 0}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Guardar {dirtyCount > 0 ? `(${dirtyCount})` : ''}
            </Button>
          </Stack>
        }
      />

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
          {(error as Error)?.message ?? 'Error al cargar configuración'}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && rows.length === 0 && !isError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay parámetros configurados. Agrega el primero con el formulario de abajo.
        </Alert>
      )}

      {rows.length > 0 && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            {rows.map((row) => (
              <Stack
                key={row.key}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
              >
                <TextField
                  value={row.key}
                  label="Clave"
                  disabled
                  sx={{ minWidth: 240, fontFamily: 'monospace' }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  value={row.value}
                  onChange={(e) => handleValueChange(row.key, e.target.value)}
                  label="Valor"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText={row.dirty ? 'Modificado (sin guardar)' : undefined}
                  color={row.dirty ? 'warning' : undefined}
                  focused={row.dirty || undefined}
                />
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Agregar nueva clave
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              label="Clave"
              placeholder="Ej. iva_pct"
              sx={{ minWidth: 240 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              label="Valor"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <IconButton color="primary" onClick={handleAddRow}>
              <Iconify icon="solar:add-circle-bold" />
            </IconButton>
          </Stack>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Las nuevas claves se crean al guardar. Si una clave ya existe en el backend, su valor
            se sobreescribe.
          </Typography>
        </Stack>
      </Card>
    </Container>
  );
}
