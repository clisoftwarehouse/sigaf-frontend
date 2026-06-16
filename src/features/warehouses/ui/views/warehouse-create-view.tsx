import type { CreateWarehousePayload } from '../../model/types';
import type { WarehouseCommon } from '../components/warehouse-form';

import { toast } from 'sonner';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { runBulkCreate } from '@/shared/lib/bulk-create';
import { useBranchOptions } from '@/features/branches/api/branches.options';

import { WarehouseForm } from '../components/warehouse-form';
import { useCreateWarehouseMutation } from '../../api/warehouses.queries';

// ----------------------------------------------------------------------

export function WarehouseCreateView() {
  const router = useRouter();
  const mutation = useCreateWarehouseMutation();
  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const handleSubmit = async (payload: CreateWarehousePayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Almacén "${created.name ?? created.locationCode}" creado`);
      router.push(paths.dashboard.organization.warehouses.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleBulkSubmit = async (common: WarehouseCommon, branchIds: string[]) => {
    const { okCount, failures } = await runBulkCreate(
      branchIds,
      (branchId) => mutation.mutateAsync({ ...common, branchId }),
      (id) => branchNameById.get(id) ?? id
    );
    if (failures.length === 0) {
      toast.success(`Almacén creado en ${okCount} sucursal(es).`);
      router.push(paths.dashboard.organization.warehouses.root);
      return;
    }
    const detail = failures.map((f) => `${f.label}: ${f.reason}`).join(' · ');
    toast.warning(`Creado en ${okCount}. Falló en ${failures.length} — ${detail}`, {
      duration: 8000,
    });
    if (okCount > 0) router.push(paths.dashboard.organization.warehouses.root);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo almacén</Typography>
      </Box>

      <WarehouseForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onBulkSubmit={handleBulkSubmit}
        onCancel={() => router.push(paths.dashboard.organization.warehouses.root)}
      />
    </Container>
  );
}
