import type { CreateActiveIngredientPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { ActiveIngredientForm } from '../components/active-ingredient-form';
import { useCreateActiveIngredientMutation } from '../../api/active-ingredients.queries';

// ----------------------------------------------------------------------

export function ActiveIngredientCreateView() {
  const router = useRouter();
  const mutation = useCreateActiveIngredientMutation();

  const handleSubmit = async (payload: CreateActiveIngredientPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Principio activo "${created.name}" creado`);
      router.push(paths.dashboard.catalog.activeIngredients.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo principio activo</Typography>
      </Box>

      <ActiveIngredientForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.catalog.activeIngredients.root)}
      />
    </Container>
  );
}
