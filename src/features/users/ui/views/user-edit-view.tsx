import type { UpdateUserPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { UserForm } from '../components/user-form';
import { useUserQuery, useUpdateUserMutation } from '../../api/users.queries';

// ----------------------------------------------------------------------

export function UserEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: user, isLoading, isError, error } = useUserQuery(id);
  const mutation = useUpdateUserMutation();

  const handleSubmit = async (payload: UpdateUserPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Usuario "${updated.username}" actualizado`);
      router.push(paths.dashboard.admin.users.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar usuario</Typography>
        {user && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {user.fullName} — {user.username}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {user && (
        <UserForm
          mode="edit"
          current={user}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.admin.users.root)}
        />
      )}
    </Container>
  );
}
