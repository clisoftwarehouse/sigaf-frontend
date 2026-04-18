import type { Terminal, CreateTerminalPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

// ----------------------------------------------------------------------

const jsonField = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (v) => {
      if (!v) return true;
      try {
        const parsed = JSON.parse(v);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
      } catch {
        return false;
      }
    },
    { message: 'JSON inválido: debe ser un objeto' }
  );

export const TerminalSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  code: z.string().min(1, { message: 'Código obligatorio' }).max(20),
  name: z.string().max(100).optional().or(z.literal('')),
  fiscalPrinterConfig: jsonField,
  scaleConfig: jsonField,
  cashDrawerConfig: jsonField,
});

export type TerminalFormValues = z.infer<typeof TerminalSchema>;

type Props = {
  current?: Terminal;
  submitting?: boolean;
  onSubmit: (values: CreateTerminalPayload) => Promise<void> | void;
  onCancel?: () => void;
};

function jsonToText(value: Record<string, unknown> | null | undefined): string {
  return value ? JSON.stringify(value, null, 2) : '';
}

function textToJson(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function toFormValues(t?: Terminal): TerminalFormValues {
  return {
    branchId: t?.branchId ?? '',
    code: t?.code ?? '',
    name: t?.name ?? '',
    fiscalPrinterConfig: jsonToText(t?.fiscalPrinterConfig),
    scaleConfig: jsonToText(t?.scaleConfig),
    cashDrawerConfig: jsonToText(t?.cashDrawerConfig),
  };
}

export function TerminalForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();

  const methods = useForm<TerminalFormValues>({
    resolver: zodResolver(TerminalSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      branchId: values.branchId,
      code: values.code.trim(),
      name: values.name?.trim() || undefined,
      fiscalPrinterConfig: textToJson(values.fiscalPrinterConfig),
      scaleConfig: textToJson(values.scaleConfig),
      cashDrawerConfig: textToJson(values.cashDrawerConfig),
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Select
            name="branchId"
            label="Sucursal"
            disabled={loadingBranches}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Selecciona una sucursal —</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="code"
              label="Código"
              placeholder="Ej. POS-01"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 160 }, flexShrink: 0 }}
            />
            <Field.Text
              name="name"
              label="Nombre (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Configuración de hardware (JSON)
          </Typography>

          <Field.Text
            name="fiscalPrinterConfig"
            label="Impresora fiscal"
            multiline
            minRows={3}
            placeholder='Ej. { "model": "BMC-220", "port": "/dev/ttyUSB0" }'
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Field.Text
            name="scaleConfig"
            label="Báscula"
            multiline
            minRows={2}
            placeholder='Ej. { "model": "CAS-PD1" }'
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Field.Text
            name="cashDrawerConfig"
            label="Gaveta de efectivo"
            multiline
            minRows={2}
            placeholder='Ej. { "open": "ESC p 0 25 250" }'
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear terminal'}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
