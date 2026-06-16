import type { Warehouse, CreateWarehousePayload } from '../../model/types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

// ----------------------------------------------------------------------

export const WarehouseSchema = z.object({
  // Opcional acá porque al CREAR la sucursal va por el selector múltiple
  // (estado del componente). En edición se valida manualmente.
  branchId: z.string().optional().or(z.literal('')),
  locationCode: z.string().min(1, { message: 'Código obligatorio' }).max(30),
  name: z.string().max(100).optional().or(z.literal('')),
  isQuarantine: z.boolean(),
  isForSale: z.boolean(),
  isForPurchase: z.boolean(),
});

export type WarehouseFormValues = z.infer<typeof WarehouseSchema>;

/** Campos comunes de la creación masiva (todo menos la sucursal). */
export type WarehouseCommon = Omit<CreateWarehousePayload, 'branchId'>;

type Props = {
  current?: Warehouse;
  submitting?: boolean;
  /** Crear un único almacén (edición, o creación en 1 sucursal). */
  onSubmit: (values: CreateWarehousePayload) => Promise<void> | void;
  /** Crear el mismo almacén en varias sucursales (solo al crear). */
  onBulkSubmit?: (common: WarehouseCommon, branchIds: string[]) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(w?: Warehouse): WarehouseFormValues {
  return {
    branchId: w?.branchId ?? '',
    locationCode: w?.locationCode ?? '',
    name: w?.name ?? '',
    isQuarantine: w?.isQuarantine ?? false,
    isForSale: w?.isForSale ?? true,
    isForPurchase: w?.isForPurchase ?? true,
  };
}

export function WarehouseForm({ current, submitting, onSubmit, onBulkSubmit, onCancel }: Props) {
  const isEdit = !!current;
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();

  // Sucursales seleccionadas al crear (creación masiva). En edición no se usa.
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [branchError, setBranchError] = useState<string | null>(null);

  const methods = useForm<WarehouseFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(WarehouseSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset, getValues, trigger, setError } = methods;

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  function commonFromValues(v: WarehouseFormValues): WarehouseCommon {
    return {
      locationCode: v.locationCode.trim(),
      name: v.name?.trim() || undefined,
      isQuarantine: v.isQuarantine,
      isForSale: v.isForSale,
      isForPurchase: v.isForPurchase,
    };
  }

  // Edición / creación de un solo almacén (RHF con branchId).
  const submitSingle = handleSubmit(async (values) => {
    if (!values.branchId) {
      setError('branchId', { message: 'Selecciona una sucursal' });
      return;
    }
    await onSubmit({ branchId: values.branchId, ...commonFromValues(values) });
  });

  // Creación masiva: valida los campos comunes + ≥1 sucursal y delega el loop.
  const submitBulk = async () => {
    const ok = await trigger(['locationCode', 'name']);
    if (!ok) return;
    if (branchIds.length === 0) {
      setBranchError('Selecciona al menos una sucursal');
      return;
    }
    await onBulkSubmit?.(commonFromValues(getValues()), branchIds);
  };

  return (
    <Form methods={methods} onSubmit={submitSingle}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {isEdit ? (
            <Field.IdAutocomplete
              name="branchId"
              label="Sucursal"
              placeholder="Buscar sucursal por nombre…"
              loading={loadingBranches}
              options={branches.map((b) => ({ id: b.id, label: b.name }))}
            />
          ) : (
            <Autocomplete
              multiple
              disableCloseOnSelect
              loading={loadingBranches}
              options={branches}
              getOptionLabel={(b) => b.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={branches.filter((b) => branchIds.includes(b.id))}
              onChange={(_, val) => {
                setBranchIds(val.map((b) => b.id));
                setBranchError(null);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sucursales"
                  placeholder="Buscar y seleccionar una o varias…"
                  error={!!branchError}
                  helperText={
                    branchError ??
                    'El almacén se creará igual en todas las sucursales seleccionadas.'
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          )}

          <Field.Text
            name="locationCode"
            label="Código del almacén"
            placeholder="Ej. VTA, REC, QRT"
            helperText="Debe ser único dentro de la sucursal."
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="name"
            label="Nombre (opcional)"
            placeholder="Ej. Sala de ventas, Recepción, Cuarentena"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Uso del almacén
          </Typography>

          <Field.Switch
            name="isForSale"
            label="Activo para venta"
            helperText="El stock de este almacén está disponible para venta en POS."
          />

          <Field.Switch
            name="isForPurchase"
            label="Activo para compra"
            helperText="Las recepciones de compra pueden ingresar mercancía a este almacén."
          />

          <Field.Switch
            name="isQuarantine"
            label="Zona de cuarentena"
            helperText="Mercancía retenida; no se vende ni se transfiere automáticamente."
          />
        </Stack>
      </Card>

      <FormFooter>
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        {isEdit ? (
          <Button type="submit" variant="contained" loading={submitting}>
            Guardar cambios
          </Button>
        ) : (
          <Button type="button" variant="contained" loading={submitting} onClick={submitBulk}>
            {branchIds.length > 1
              ? `Crear en ${branchIds.length} sucursales`
              : 'Crear almacén'}
          </Button>
        )}
      </FormFooter>
    </Form>
  );
}
