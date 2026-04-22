import type { Role, CreateRolePayload } from '../../model/types';

import * as z from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { usePermissionsQuery } from '@/features/permissions/api/permissions.queries';

// ----------------------------------------------------------------------

export const RoleSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(50, { message: 'Máximo 50 caracteres' }),
  description: z.string().optional().or(z.literal('')),
  permissionIds: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof RoleSchema>;

type Props = {
  current?: Role;
  submitting?: boolean;
  onSubmit: (values: CreateRolePayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function RoleForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: permissions = [] } = usePermissionsQuery();

  const methods = useForm<RoleFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: current?.name ?? '',
      description: current?.description ?? '',
      permissionIds: current?.permissions?.map((p) => p.id) ?? [],
    },
  });

  const { control, handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({
        name: current.name ?? '',
        description: current.description ?? '',
        permissionIds: current.permissions?.map((p) => p.id) ?? [],
      });
    }
  }, [current, reset]);

  const permissionsByModule = useMemo(() => {
    const groups = new Map<string, typeof permissions>();
    permissions.forEach((p) => {
      const arr = groups.get(p.module) ?? [];
      arr.push(p);
      groups.set(p.module, arr);
    });
    return permissions;
  }, [permissions]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      permissionIds: values.permissionIds,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Datos del rol
          </Typography>
          <Stack spacing={2}>
            <Field.Text
              name="name"
              label="Nombre"
              placeholder="Ej. gerente_inventario"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Text
              name="description"
              label="Descripción"
              multiline
              rows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Permisos ({permissionsByModule.length} disponibles)
          </Typography>
          <Controller
            control={control}
            name="permissionIds"
            render={({ field, fieldState }) => {
              const selected = permissions.filter((p) => field.value.includes(p.id));
              return (
                <Autocomplete
                  multiple
                  options={permissions}
                  value={selected}
                  onChange={(_e, next) => field.onChange(next.map((p) => p.id))}
                  groupBy={(option) => option.module}
                  getOptionLabel={(option) => option.code}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {option.code}
                        </Typography>
                        {option.description && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                  renderValue={(value, getItemProps) =>
                    value.map((option, index) => {
                      const { key, ...itemProps } = getItemProps({ index });
                      return (
                        <Chip
                          key={key}
                          {...itemProps}
                          size="small"
                          label={option.code}
                          sx={{ fontFamily: 'monospace' }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Permisos asignados"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              );
            }}
          />
        </Card>
      </Stack>

      <FormFooter>
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="contained" loading={submitting}>
          {current ? 'Guardar cambios' : 'Crear rol'}
        </Button>
      </FormFooter>
    </Form>
  );
}
