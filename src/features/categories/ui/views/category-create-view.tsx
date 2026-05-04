import type { CreateCategoryPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { CategoryForm } from '../components/category-form';
import { useCategoriesQuery, useCreateCategoryMutation } from '../../api/categories.queries';

// ----------------------------------------------------------------------

export function CategoryCreateView() {
  const router = useRouter();
  const { flat: parents } = useCategoriesQuery();
  const mutation = useCreateCategoryMutation();

  const handleSubmit = async (payload: CreateCategoryPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Categoría "${created.name}" creada`);
      router.push(paths.dashboard.catalog.categories.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nueva categoría</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Registra una categoría del catálogo (puede tener categoría padre).
        </Typography>
      </Box>

      <CategoryForm
        parents={parents}
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.catalog.categories.root)}
      />
    </Container>
  );
}
