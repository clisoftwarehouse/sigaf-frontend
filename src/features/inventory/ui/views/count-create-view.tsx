import * as z from 'zod';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm , Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useCategoryOptions } from '@/features/categories/api/categories.options';

import { useCreateCountMutation } from '../../api/counts.queries';
import { COUNT_TYPES, COUNT_TYPE_OPTIONS } from '../../model/counts-types';

// ----------------------------------------------------------------------

const CountSchema = z.object({
  branchId: z.string().min(1, { message: 'La sucursal es obligatoria' }),
  countType: z.enum(COUNT_TYPES),
  categoryId: z.string().optional().or(z.literal('')),
  locationId: z.string().optional().or(z.literal('')),
  productIds: z.array(z.string()),
  notes: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof CountSchema>;

export function CountCreateView() {
  const router = useRouter();
  const mutation = useCreateCountMutation();

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: productOpts = [] } = useProductOptions();
  const { data: categoryOpts = [] } = useCategoryOptions();

  const methods = useForm<FormValues>({
    resolver: zodResolver(CountSchema),
    defaultValues: {
      branchId: '',
      countType: 'full',
      categoryId: '',
      locationId: '',
      productIds: [],
      notes: '',
    },
  });

  const { handleSubmit, watch, control } = methods;
  const countType = watch('countType');

  const submit = handleSubmit(async (values) => {
    try {
      const created = await mutation.mutateAsync({
        branchId: values.branchId,
        countType: values.countType,
        categoryId: values.categoryId || undefined,
        locationId: values.locationId || undefined,
        productIds: values.productIds.length > 0 ? values.productIds : undefined,
        notes: values.notes?.trim() || undefined,
      });
      toast.success(`Toma ${created.countNumber} creada`);
      router.push(paths.dashboard.inventory.counts.detail(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nueva toma de inventario</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Define el alcance y crea la toma en estado borrador. Luego podrás iniciarla para
          registrar cantidades físicas.
        </Typography>
      </Box>

      <Form methods={methods} onSubmit={submit}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
              Datos generales
            </Typography>
            <Stack spacing={2}>
              <Field.Select name="branchId" label="Sucursal">
                {branchOpts.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="countType" label="Tipo de toma">
                {COUNT_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="notes"
                label="Notas"
                multiline
                rows={2}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Card>

          {countType === 'partial' && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Alcance parcial
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                Filtra por categoría, ubicación o una lista específica de productos.
              </Typography>
              <Stack spacing={2}>
                <Field.Select name="categoryId" label="Categoría (opcional)">
                  <MenuItem value="">— Todas —</MenuItem>
                  {categoryOpts.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Text
                  name="locationId"
                  label="ID de ubicación física (opcional)"
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Controller
                  control={control}
                  name="productIds"
                  render={({ field }) => {
                    const selected = productOpts.filter((p) => field.value.includes(p.id));
                    return (
                      <Autocomplete
                        multiple
                        options={productOpts}
                        value={selected}
                        onChange={(_e, next) => field.onChange(next.map((p) => p.id))}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        renderValue={(value, getItemProps) =>
                          value.map((option, index) => {
                            const { key, ...itemProps } = getItemProps({ index });
                            return (
                              <Chip key={key} {...itemProps} size="small" label={option.label} />
                            );
                          })
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Productos específicos (opcional)" />
                        )}
                      />
                    );
                  }}
                />
              </Stack>
            </Card>
          )}

          {countType === 'cycle' && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Alcance cíclico
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                Selecciona los productos a rotar. Usa el módulo de Programas cíclicos para
                automatizar esto por clases ABC.
              </Typography>
              <Controller
                control={control}
                name="productIds"
                render={({ field }) => {
                  const selected = productOpts.filter((p) => field.value.includes(p.id));
                  return (
                    <Autocomplete
                      multiple
                      options={productOpts}
                      value={selected}
                      onChange={(_e, next) => field.onChange(next.map((p) => p.id))}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderValue={(value, getItemProps) =>
                        value.map((option, index) => {
                          const { key, ...itemProps } = getItemProps({ index });
                          return (
                            <Chip key={key} {...itemProps} size="small" label={option.label} />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Productos a contar" />
                      )}
                    />
                  );
                }}
              />
            </Card>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => router.push(paths.dashboard.inventory.counts.root)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="contained" loading={mutation.isPending}>
              Crear toma
            </Button>
          </Box>
        </Stack>
      </Form>
    </Container>
  );
}
