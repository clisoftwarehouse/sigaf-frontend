import type { CreateRolePayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { RoleForm } from '../components/role-form';
import { useCreateRoleMutation } from '../../api/roles.queries';

// ----------------------------------------------------------------------

export function RoleCreateView() {
  const router = useRouter();
  const mutation = useCreateRoleMutation();

  const handleSubmit = async (payload: CreateRolePayload) => {
    try {
      await mutation.mutateAsync(payload);
      toast.success(`Rol "${payload.name}" creado`);
      router.push(paths.dashboard.admin.roles.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo rol</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Define un rol y asígnale permisos granulares.
        </Typography>
      </Box>

      <RoleForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.admin.roles.root)}
      />
    </Container>
  );
}
