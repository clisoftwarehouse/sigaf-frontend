import type { LibroPeriod } from '../../model/types';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import { PageHeader } from '@/shared/ui/page-header';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { LibroVentasView } from '../views/libro-ventas-view';
import { PeriodSelector } from '../components/period-selector';
import { LibroComprasView } from '../views/libro-compras-view';

type TabKey = 'ventas' | 'compras';

export default function LibrosIvaPage() {
  const { selectedBranchId } = useBranchScope();
  const now = new Date();
  const [tab, setTab] = useState<TabKey>('ventas');
  const [period, setPeriod] = useState<LibroPeriod>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Libros de IVA"
        subtitle="Libro de Ventas y Compras conforme a SENIAT (Providencia 0071). Montos en USD y Bs."
        crumbs={[{ label: 'Administración' }, { label: 'Libros de IVA' }]}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="ventas" label="Libro de Ventas" />
          <Tab value="compras" label="Libro de Compras" />
        </Tabs>
        <PeriodSelector value={period} onChange={setPeriod} />
      </Stack>

      {tab === 'ventas' && (
        <LibroVentasView period={period} branchId={selectedBranchId ?? undefined} />
      )}
      {tab === 'compras' && (
        <LibroComprasView period={period} branchId={selectedBranchId ?? undefined} />
      )}
    </Container>
  );
}
