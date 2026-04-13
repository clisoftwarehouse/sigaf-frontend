import type { SigafUser, CreateUserPayload, UpdateUserPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Form, Field } from '@/app/components/hook-form';
import { useRolesQuery } from '@/features/roles/api/roles.queries';

// ----------------------------------------------------------------------

const optionalEmail = z
  .string()
  .max(150)
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: 'Email inválido' });

export const CreateUserSchema = z.object({
  username: z.string().min(1, { message: 'Nombre de usuario obligatorio' }),
  password: z
    .string()
    .min(1, { message: 'Contraseña obligatoria' })
    .min(6, { message: 'Mínimo 6 caracteres' }),
  fullName: z.string().min(1, { message: 'Nombre completo obligatorio' }),
  cedula: z.string().optional().or(z.literal('')),
  email: optionalEmail,
  phone: z.string().max(20).optional().or(z.literal('')),
  roleId: z.string().optional().or(z.literal('')),
});

export const UpdateUserSchema = z.object({
  password: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || v.length >= 6, { message: 'Mínimo 6 caracteres' }),
  fullName: z.string().min(1, { message: 'Nombre completo obligatorio' }),
  cedula: z.string().optional().or(z.literal('')),
  email: optionalEmail,
  phone: z.string().max(20).optional().or(z.literal('')),
  roleId: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type CreateUserFormValues = z.infer<typeof CreateUserSchema>;
export type UpdateUserFormValues = z.infer<typeof UpdateUserSchema>;

// ----------------------------------------------------------------------

type CreateProps = {
  mode: 'create';
  submitting?: boolean;
  onSubmit: (payload: CreateUserPayload) => Promise<void> | void;
  onCancel?: () => void;
};

type EditProps = {
  mode: 'edit';
  current: SigafUser;
  submitting?: boolean;
  onSubmit: (payload: UpdateUserPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function UserForm(props: CreateProps | EditProps) {
  const { data: roles = [], isLoading: loadingRoles } = useRolesQuery();

  if (props.mode === 'create') {
    return <CreateUserForm {...props} roles={roles} loadingRoles={loadingRoles} />;
  }
  return <EditUserForm {...props} roles={roles} loadingRoles={loadingRoles} />;
}

// ----------------------------------------------------------------------

type RoleOption = { id: string; name?: string };

function CreateUserForm({
  submitting,
  onSubmit,
  onCancel,
  roles,
  loadingRoles,
}: CreateProps & { roles: RoleOption[]; loadingRoles: boolean }) {
  const methods = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      cedula: '',
      email: '',
      phone: '',
      roleId: '',
    },
  });

  const submit = methods.handleSubmit(async (values) => {
    await onSubmit({
      username: values.username.trim(),
      password: values.password,
      fullName: values.fullName.trim(),
      cedula: values.cedula?.trim() || null,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      role: values.roleId ? { id: values.roleId } : null,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Credenciales
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="username"
              label="Usuario"
              placeholder="Ej. jperez"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="password"
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Perfil
          </Typography>

          <Field.Text
            name="fullName"
            label="Nombre completo"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="cedula"
              label="Cédula (opcional)"
              placeholder="Ej. V-12345678"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="phone"
              label="Teléfono (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Field.Text
            name="email"
            label="Email (opcional)"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Select
            name="roleId"
            label="Rol"
            disabled={loadingRoles}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Sin rol asignado —</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id} sx={{ textTransform: 'capitalize' }}>
                {r.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              Crear usuario
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}

// ----------------------------------------------------------------------

function EditUserForm({
  current,
  submitting,
  onSubmit,
  onCancel,
  roles,
  loadingRoles,
}: EditProps & { roles: RoleOption[]; loadingRoles: boolean }) {
  const methods = useForm<UpdateUserFormValues>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      password: '',
      fullName: current.fullName,
      cedula: current.cedula ?? '',
      email: current.email ?? '',
      phone: current.phone ?? '',
      roleId: current.role?.id ?? '',
      isActive: current.isActive,
    },
  });

  useEffect(() => {
    methods.reset({
      password: '',
      fullName: current.fullName,
      cedula: current.cedula ?? '',
      email: current.email ?? '',
      phone: current.phone ?? '',
      roleId: current.role?.id ?? '',
      isActive: current.isActive,
    });
  }, [current, methods]);

  const submit = methods.handleSubmit(async (values) => {
    await onSubmit({
      password: values.password ? values.password : undefined,
      fullName: values.fullName.trim(),
      cedula: values.cedula?.trim() || null,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      role: values.roleId ? { id: values.roleId } : null,
      isActive: values.isActive,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Identidad (no editable)
          </Typography>
          <Field.Text
            name="username"
            label="Usuario"
            value={current.username}
            disabled
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Perfil
          </Typography>

          <Field.Text
            name="fullName"
            label="Nombre completo"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="cedula"
              label="Cédula (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="phone"
              label="Teléfono (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Field.Text
            name="email"
            label="Email (opcional)"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Select
            name="roleId"
            label="Rol"
            disabled={loadingRoles}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Sin rol asignado —</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id} sx={{ textTransform: 'capitalize' }}>
                {r.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Seguridad
          </Typography>

          <Field.Text
            name="password"
            label="Nueva contraseña (opcional)"
            type="password"
            placeholder="Déjalo vacío para no cambiarla"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Switch
            name="isActive"
            label="Cuenta activa"
            helperText="Las cuentas inactivas no pueden iniciar sesión."
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              Guardar cambios
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
