import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { CONFIG } from '@/app/global-config';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { Form, Field } from '@/app/components/hook-form';

import { useAuthContext } from '../hooks';
import { getErrorMessage } from '../utils';
import { FormHead } from '../components/form-head';
import { signInWithPassword } from '../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = z.infer<typeof SignInSchema>;

export const SignInSchema = z.object({
  email: z.string().min(1, { message: 'Ingresa tu usuario' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error));
    }
  });

  const renderForm = () => (
    <Stack spacing={2.5}>
      <Field.Text
        name="email"
        label="Usuario"
        placeholder="Tu nombre de usuario"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="password"
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Ingresando…"
        sx={{
          mt: 1,
          py: 1.5,
          fontSize: 15,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 8px 16px -4px rgba(15, 27, 45, 0.25)',
        }}
      >
        Iniciar sesión
      </Button>
    </Stack>
  );

  return (
    <Box
      sx={(theme) => ({
        width: 1,
        p: { xs: 3, sm: 5 },
        borderRadius: 2,
        backgroundColor: 'background.paper',
        boxShadow: {
          xs: 'none',
          md: '0 24px 48px -16px rgba(15, 27, 45, 0.12), 0 4px 12px -4px rgba(15, 27, 45, 0.05)',
        },
        border: { xs: 'none', md: `1px solid ${theme.vars.palette.divider}` },
      })}
    >
      <FormHead
        title="Inicia sesión"
        description={`Accede a ${CONFIG.appName} con las credenciales proporcionadas por tu administrador.`}
        sx={{ textAlign: 'center', alignItems: 'center' }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <Divider sx={{ my: 4 }} />

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          color: 'text.secondary',
          lineHeight: 1.6,
        }}
      >
        ¿Problemas para acceder? Contacta a tu administrador del sistema
        <br />o al equipo de soporte de Grupo Universal 25.
      </Typography>
    </Box>
  );
}
