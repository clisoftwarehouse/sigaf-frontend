import type { CreateUserPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { UserForm } from '../components/user-form';
import { useCreateUserMutation } from '../../api/users.queries';

// ----------------------------------------------------------------------

export function UserCreateView() {
  const router = useRouter();
  const mutation = useCreateUserMutation();

  const handleSubmit = async (payload: CreateUserPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Usuario "${created.username}" creado`);
      router.push(paths.dashboard.admin.users.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo usuario</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          El backend hasheará la contraseña al crear la cuenta.
        </Typography>
      </Box>

      <UserForm
        mode="create"
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.admin.users.root)}
      />
    </Container>
  );
}
