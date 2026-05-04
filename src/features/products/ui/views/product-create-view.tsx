import type { CreateProductPayload } from '../../model/types';

import { toast } from 'sonner';

import Container from '@mui/material/Container';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { PageHeader } from '@/shared/ui/page-header';

import { ProductForm } from '../components/product-form';
import { useCreateProductMutation } from '../../api/products.queries';

// ----------------------------------------------------------------------

export function ProductCreateView() {
  const router = useRouter();
  const mutation = useCreateProductMutation();

  const handleSubmit = async (payload: CreateProductPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Producto "${created.shortName ?? created.description}" creado`);
      router.push(paths.dashboard.catalog.products.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Nuevo producto"
        subtitle='El backend auto-ajusta algunos campos: tipo "controlado" fuerza récipe, producto pesable fuerza KG con 3 decimales.'
        crumbs={[{ label: 'Catálogo' }, { label: 'Productos' }, { label: 'Nuevo' }]}
      />

      <ProductForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.catalog.products.root)}
      />
    </Container>
  );
}
