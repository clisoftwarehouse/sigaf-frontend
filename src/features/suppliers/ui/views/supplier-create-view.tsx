import type { CreateSupplierPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { SupplierForm } from '../components/supplier-form';
import { useCreateSupplierMutation } from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

export function SupplierCreateView() {
  const router = useRouter();
  const mutation = useCreateSupplierMutation();

  const handleSubmit = async (payload: CreateSupplierPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Proveedor "${created.businessName}" creado`);
      router.push(paths.dashboard.catalog.suppliers.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo proveedor</Typography>
      </Box>

      <SupplierForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.catalog.suppliers.root)}
      />
    </Container>
  );
}
