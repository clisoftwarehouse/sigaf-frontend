import type { Category, CreateCategoryPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

export const CategorySchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }).max(100),
  code: z.string().max(20).optional().or(z.literal('')),
  parentId: z.string().optional().or(z.literal('')),
  isPharmaceutical: z.boolean(),
  defaultMarginPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 99.99), {
      message: 'Margen entre 0 y 99.99',
    }),
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
    mode: 'onBlur',
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: current?.name ?? '',
      code: current?.code ?? '',
      parentId: current?.parentId ?? '',
      isPharmaceutical: current?.isPharmaceutical ?? false,
      defaultMarginPct: current?.defaultMarginPct != null ? String(current.defaultMarginPct) : '',
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
        defaultMarginPct: current.defaultMarginPct != null ? String(current.defaultMarginPct) : '',
      });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      code: values.code ? values.code.trim() : undefined,
      parentId: values.parentId ? values.parentId : undefined,
      isPharmaceutical: values.isPharmaceutical,
      defaultMarginPct: values.defaultMarginPct ? Number(values.defaultMarginPct) : undefined,
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

          <Field.IdAutocomplete
            name="parentId"
            label="Categoría padre (opcional)"
            placeholder="Buscar categoría por nombre…"
            helperText="Déjalo vacío para una categoría raíz."
            options={parentOptions.map((c) => ({ id: c.id, label: c.name }))}
          />

          <Field.Text
            name="defaultMarginPct"
            label="Margen por defecto (% sobre venta)"
            placeholder="Ej. 30"
            helperText="Se precarga al fijar precio de los productos de esta categoría (editable). Vacío = usa el margen global."
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'decimal', min: 0, max: 99.99, step: 0.5 } }}
          />

          <Field.Switch name="isPharmaceutical" label="Es categoría farmacéutica" />
        </Stack>
      </Card>

      <FormFooter>
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="contained" loading={submitting}>
          {current ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </FormFooter>
    </Form>
  );
}
