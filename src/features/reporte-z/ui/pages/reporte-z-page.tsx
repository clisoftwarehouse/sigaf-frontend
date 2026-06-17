import type { LibroPeriod } from '@/features/libros-iva/model/types';

import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import { PageHeader } from '@/shared/ui/page-header';
import { PeriodSelector } from '@/features/libros-iva/ui/components/period-selector';

import { ReporteZView } from '../views/reporte-z-view';

export default function ReporteZPage() {
  const now = new Date();
  const [period, setPeriod] = useState<LibroPeriod>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Reporte Z (cierres fiscales)"
        subtitle="Cierres Z capturados de las máquinas fiscales. Los totales vienen de la impresora; se concilian contra el Libro de Ventas."
        crumbs={[{ label: 'Administración' }, { label: 'Reporte Z' }]}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="flex-end"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </Stack>

      <ReporteZView period={period} />
    </Container>
  );
}
