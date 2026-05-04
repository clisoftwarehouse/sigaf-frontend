import type { CreateBranchPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { BranchForm } from '../components/branch-form';
import { useBranchQuery, useUpdateBranchMutation } from '../../api/branches.queries';

// ----------------------------------------------------------------------

export function BranchEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: branch, isLoading, isError, error } = useBranchQuery(id);
  const mutation = useUpdateBranchMutation();

  const handleSubmit = async (payload: CreateBranchPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Sucursal "${updated.name}" actualizada`);
      router.push(paths.dashboard.organization.branches.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar sucursal</Typography>
        {branch && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {branch.name}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {branch && (
        <BranchForm
          current={branch}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.organization.branches.root)}
        />
      )}
    </Container>
  );
}
