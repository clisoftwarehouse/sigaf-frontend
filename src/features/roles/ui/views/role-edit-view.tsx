import type { CreateRolePayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { RoleForm } from '../components/role-form';
import { useRoleQuery, useUpdateRoleMutation } from '../../api/roles.queries';

// ----------------------------------------------------------------------

export function RoleEditView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: role, isLoading, isError, error } = useRoleQuery(id);
  const mutation = useUpdateRoleMutation();

  const handleSubmit = async (payload: CreateRolePayload) => {
    if (!id) return;
    try {
      await mutation.mutateAsync({ id, payload });
      toast.success(`Rol "${payload.name}" actualizado`);
      router.push(paths.dashboard.admin.roles.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar rol</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Actualiza nombre, descripción y permisos asignados.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {role && (
        <RoleForm
          current={role}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.admin.roles.root)}
        />
      )}
    </Container>
  );
}
