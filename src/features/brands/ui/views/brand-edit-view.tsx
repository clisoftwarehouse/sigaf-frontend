import type { CreateBrandPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { BrandForm } from '../components/brand-form';
import { useBrandQuery, useUpdateBrandMutation } from '../../api/brands.queries';

// ----------------------------------------------------------------------

export function BrandEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: brand, isLoading, isError, error } = useBrandQuery(id);
  const mutation = useUpdateBrandMutation();

  const handleSubmit = async (payload: CreateBrandPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Marca "${updated.name}" actualizada`);
      router.push(paths.dashboard.catalog.brands.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar marca</Typography>
        {brand && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {brand.name}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {brand && (
        <BrandForm
          current={brand}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.catalog.brands.root)}
        />
      )}
    </Container>
  );
}
