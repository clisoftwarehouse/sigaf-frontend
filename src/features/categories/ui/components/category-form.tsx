import type { Category, CreateCategoryPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

export const CategorySchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }).max(100),
  code: z.string().max(20).optional().or(z.literal('')),
  parentId: z.string().optional().or(z.literal('')),
  isPharmaceutical: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof CategorySchema>;

type Props = {
  current?: Category;
  parents: Category[];
  submitting?: boolean;
  onSubmit: (values: CreateCategoryPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function CategoryForm({ current, parents, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: current?.name ?? '',
      code: current?.code ?? '',
      parentId: current?.parentId ?? '',
      isPharmaceutical: current?.isPharmaceutical ?? false,
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        code: current.code ?? '',
        parentId: current.parentId ?? '',
        isPharmaceutical: current.isPharmaceutical,
      });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      code: values.code ? values.code.trim() : undefined,
      parentId: values.parentId ? values.parentId : undefined,
      isPharmaceutical: values.isPharmaceutical,
    });
  });

  // Avoid letting a category be its own parent
  const parentOptions = parents.filter((c) => c.id !== current?.id);

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text
            name="name"
            label="Nombre"
            placeholder="Ej. Medicamentos"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="code"
            label="Código (opcional)"
            placeholder="Ej. MED"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Select name="parentId" label="Categoría padre (opcional)">
            <MenuItem value="">— Ninguna (raíz) —</MenuItem>
            {parentOptions.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Switch name="isPharmaceutical" label="Es categoría farmacéutica" />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
