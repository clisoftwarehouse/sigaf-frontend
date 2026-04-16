import type { CreateSupplierPayload } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { SupplierForm } from '../components/supplier-form';
import { SupplierContactsTab } from '../components/supplier-contacts-tab';
import { SupplierProductsTab } from '../components/supplier-products-tab';
import { useSupplierQuery, useUpdateSupplierMutation } from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

type TabKey = 'data' | 'contacts' | 'products';

export function SupplierEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('data');

  const { data: supplier, isLoading, isError, error } = useSupplierQuery(id);
  const mutation = useUpdateSupplierMutation();

  const handleSubmit = async (payload: CreateSupplierPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Proveedor "${updated.businessName}" actualizado`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
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

      {supplier && id && (
        <>
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={tab}
              onChange={(_e, v: TabKey) => setTab(v)}
              sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Datos generales" value="data" />
              <Tab label="Contactos" value="contacts" />
              <Tab label="Productos" value="products" />
            </Tabs>
          </Card>

          {tab === 'data' && (
            <SupplierForm
              current={supplier}
              submitting={mutation.isPending}
              onSubmit={handleSubmit}
              onCancel={() => router.push(paths.dashboard.catalog.suppliers.root)}
            />
          )}

          {tab === 'contacts' && (
            <Card sx={{ p: 3 }}>
              <SupplierContactsTab supplierId={id} />
            </Card>
          )}

          {tab === 'products' && (
            <Card sx={{ p: 3 }}>
              <SupplierProductsTab supplierId={id} />
            </Card>
          )}
        </>
      )}
    </Container>
  );
}
