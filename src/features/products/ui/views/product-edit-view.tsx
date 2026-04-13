import type { CreateProductPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { PageHeader } from '@/shared/ui/page-header';

import { ProductForm } from '../components/product-form';
import { BarcodesManager } from '../components/barcodes-manager';
import { IngredientsManager } from '../components/ingredients-manager';
import { useProductQuery, useUpdateProductMutation } from '../../api/products.queries';

// ----------------------------------------------------------------------

export function ProductEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading, isError, error } = useProductQuery(id);
  const mutation = useUpdateProductMutation();

  const handleSubmit = async (payload: CreateProductPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Producto "${updated.shortName ?? updated.description}" actualizado`);
      router.push(paths.dashboard.catalog.products.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <PageHeader
        title="Editar producto"
        subtitle={product?.description}
        crumbs={[{ label: 'Catálogo' }, { label: 'Productos' }, { label: 'Editar' }]}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {product && (
        <Stack spacing={3}>
          <ProductForm
            current={product}
            submitting={mutation.isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.push(paths.dashboard.catalog.products.root)}
          />

          <BarcodesManager product={product} />

          <IngredientsManager product={product} />
        </Stack>
      )}
    </Container>
  );
}
