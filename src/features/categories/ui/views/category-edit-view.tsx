import type { CreateCategoryPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { CategoryForm } from '../components/category-form';
import {
  useCategoryQuery,
  useCategoriesQuery,
  useUpdateCategoryMutation,
} from '../../api/categories.queries';

// ----------------------------------------------------------------------

export function CategoryEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: current, isLoading, isError, error } = useCategoryQuery(id);
  const { flat: parents } = useCategoriesQuery();
  const mutation = useUpdateCategoryMutation();

  const handleSubmit = async (payload: CreateCategoryPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Categoría "${updated.name}" actualizada`);
      router.push(paths.dashboard.catalog.categories.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar categoría</Typography>
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
        <CategoryForm
          current={current}
          parents={parents}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.catalog.categories.root)}
        />
      )}
    </Container>
  );
}
