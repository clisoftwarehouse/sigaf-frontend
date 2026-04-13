import type { CreateSupplierPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { SupplierForm } from '../components/supplier-form';
import { useSupplierQuery, useUpdateSupplierMutation } from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

export function SupplierEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: supplier, isLoading, isError, error } = useSupplierQuery(id);
  const mutation = useUpdateSupplierMutation();

  const handleSubmit = async (payload: CreateSupplierPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Proveedor "${updated.businessName}" actualizado`);
      router.push(paths.dashboard.catalog.suppliers.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar proveedor</Typography>
        {supplier && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {supplier.businessName}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {supplier && (
        <SupplierForm
          current={supplier}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.catalog.suppliers.root)}
        />
      )}
    </Container>
  );
}
