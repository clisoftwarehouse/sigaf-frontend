import type { ConfigMap } from '../../api/config.api';
import type { ConfigKeyMeta } from '../../model/config-keys';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { CONFIG_GROUPS, KNOWN_CONFIG_KEYS } from '../../model/config-keys';
import { useConfigQuery, useUpdateConfigMutation } from '../../api/config.queries';

// ----------------------------------------------------------------------

type DirtyMap = Record<string, string>;

export function ConfigView() {
  const { data: config, isLoading, isError, error, refetch } = useConfigQuery();
  const mutation = useUpdateConfigMutation();

  const [values, setValues] = useState<ConfigMap>({});
  const [dirty, setDirty] = useState<DirtyMap>({});

  useEffect(() => {
    if (config) {
      setValues(config);
      setDirty({});
    }
  }, [config]);

  const dirtyCount = Object.keys(dirty).length;

  const unknownKeys = useMemo(
    () =>
      Object.keys(values)
        .filter((k) => !KNOWN_CONFIG_KEYS.has(k))
        .sort(),
    [values]
  );

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => {
      const original = config?.[key] ?? '';
      if (value === original) {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleSave = async () => {
    if (dirtyCount === 0) {
      toast.info?.('No hay cambios para guardar');
      return;
    }
    try {
      await mutation.mutateAsync(dirty);
      toast.success(
        `${dirtyCount} ${dirtyCount === 1 ? 'parámetro actualizado' : 'parámetros actualizados'}`
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleReset = () => {
    if (config) {
      setValues(config);
      setDirty({});
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Configuración global"
        subtitle="Parámetros del sistema (IVA, IGTF, tasa BCV, alertas FEFO, tolerancias de compra)."
        crumbs={[{ label: 'Administración' }, { label: 'Configuración' }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleReset}
              disabled={dirtyCount === 0}
            >
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

      {!isLoading && (
        <Stack spacing={3}>
          {CONFIG_GROUPS.map((group) => (
            <Card key={group.title} sx={{ p: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6">{group.title}</Typography>
                {group.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {group.description}
                  </Typography>
                )}
              </Box>

              <Stack spacing={2.5}>
                {group.keys.map((meta) => (
                  <ConfigField
                    key={meta.key}
                    meta={meta}
                    value={values[meta.key] ?? ''}
                    isDirty={meta.key in dirty}
                    onChange={(v) => handleChange(meta.key, v)}
                  />
                ))}
              </Stack>
            </Card>
          ))}

          {unknownKeys.length > 0 && (
            <Card sx={{ p: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6">Otros parámetros</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Parámetros existentes en el backend que aún no tienen metadatos en esta UI.
                </Typography>
              </Box>
              <Stack spacing={2.5}>
                {unknownKeys.map((key) => (
                  <ConfigField
                    key={key}
                    meta={{ key, label: key, type: 'text' }}
                    value={values[key] ?? ''}
                    isDirty={key in dirty}
                    onChange={(v) => handleChange(key, v)}
                  />
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      )}
    </Container>
  );
}

// ----------------------------------------------------------------------

type ConfigFieldProps = {
  meta: ConfigKeyMeta;
  value: string;
  isDirty: boolean;
  onChange: (value: string) => void;
};

function ConfigField({ meta, value, isDirty, onChange }: ConfigFieldProps) {
  const inputType = meta.type === 'text' ? 'text' : 'number';
  const step = meta.type === 'integer' ? '1' : '0.01';

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
      <Box sx={{ minWidth: { sm: 260 }, flex: { sm: '0 0 260px' } }}>
        <Typography variant="subtitle2">{meta.label}</Typography>
        {meta.description && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
          >
            {meta.description}
          </Typography>
        )}
      </Box>

      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={inputType}
        fullWidth
        size="small"
        slotProps={{
          input: {
            inputProps: inputType === 'number' ? { step, min: 0 } : undefined,
            endAdornment: meta.unit ? (
              <InputAdornment position="end">{meta.unit}</InputAdornment>
            ) : undefined,
          },
        }}
        helperText={isDirty ? 'Modificado (sin guardar)' : ' '}
        color={isDirty ? 'warning' : undefined}
        focused={isDirty || undefined}
      />
    </Stack>
  );
}
