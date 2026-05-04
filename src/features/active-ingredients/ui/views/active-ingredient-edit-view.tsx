import type { CreateActiveIngredientPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { ActiveIngredientForm } from '../components/active-ingredient-form';
import {
  useActiveIngredientQuery,
  useUpdateActiveIngredientMutation,
} from '../../api/active-ingredients.queries';

// ----------------------------------------------------------------------

export function ActiveIngredientEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: current, isLoading, isError, error } = useActiveIngredientQuery(id);
  const mutation = useUpdateActiveIngredientMutation();

  const handleSubmit = async (payload: CreateActiveIngredientPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Principio activo "${updated.name}" actualizado`);
      router.push(paths.dashboard.catalog.activeIngredients.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar principio activo</Typography>
        {current && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {current.name}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {current && (
        <ActiveIngredientForm
          current={current}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.catalog.activeIngredients.root)}
        />
      )}
    </Container>
  );
}
