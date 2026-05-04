import type { CreateBranchPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { BranchForm } from '../components/branch-form';
import { useCreateBranchMutation } from '../../api/branches.queries';

// ----------------------------------------------------------------------

export function BranchCreateView() {
  const router = useRouter();
  const mutation = useCreateBranchMutation();

  const handleSubmit = async (payload: CreateBranchPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Sucursal "${created.name}" creada`);
      router.push(paths.dashboard.organization.branches.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nueva sucursal</Typography>
      </Box>

      <BranchForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.organization.branches.root)}
      />
    </Container>
  );
}
